import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

async function getSeriesSchemaData(slug: string) {
  const series = await db.series.findUnique({
    where: { slug },
    include: {
      creator: {
        select: {
          username: true,
        },
      },
      genres: {
        include: {
          genre: true,
        },
      },
      chapters: {
        where: { isPublished: true },
        take: 1,
        orderBy: { chapterNumber: 'desc' },
        select: {
          chapterNumber: true,
          title: true,
          publishedAt: true,
        },
      },
      ratings: {
        take: 10,
        select: {
          rating: true,
          createdAt: true,
        },
      },
    },
  })

  if (!series) {
    return null
  }

  // Calculate aggregate rating
  const averageRating = series.ratings.length > 0
    ? series.ratings.reduce((sum, r) => sum + r.rating, 0) / series.ratings.length
    : null

  return {
    series,
    averageRating,
  }
}

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const data = await getSeriesSchemaData(params.slug)

    if (!data.series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaverse.com'

    const webSiteSchema = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${baseUrl}/series/${data.series.slug}`,
      url: `${baseUrl}/series/${data.series.slug}`,
      name: data.series.title,
      description: data.series.description || `Read ${data.series.title} on MangaVerse`,
      inLanguage: 'en',
      isAccessibleForFree: true,
      potentialAction: {
        '@type': 'ReadAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${baseUrl}/reader/{series.slug}/{chapterNumber}`,
        },
      },
      publisher: {
        '@type': 'Organization',
        name: 'MangaVerse',
        url: baseUrl,
        logo: `${baseUrl}/icon-512.png`,
      },
    }

    const creativeWorkSchema = {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      '@id': `${baseUrl}/series/${data.series.slug}#creative`,
      name: data.series.title,
      description: data.series.description,
      author: {
        '@type': 'Person',
        name: data.series.author,
        url: `${baseUrl}/creators/${data.series.creator.username}`,
      },
      image: data.series.coverImage,
      genre: data.series.genres.map((g) => g.genre.name).join(', '),
      keywords: data.series.genres.map((g) => g.genre.name).join(', '),
      datePublished: data.series.createdAt,
      isAccessibleForFree: true,
    }

    const bookSchema = {
      '@context': 'https://schema.org',
      '@type': 'Book',
      '@id': `${baseUrl}/series/${data.series.slug}#book`,
      name: data.series.title,
      author: {
        '@type': 'Person',
        name: data.series.author,
        url: `${baseUrl}/creators/${data.series.creator.username}`,
      },
      url: `${baseUrl}/series/${data.series.slug}`,
      workExample: {
        '@type': 'Book',
        name: `${data.series.title} Chapter ${data.series.chapters[0]?.chapterNumber}`,
        url: `${baseUrl}/reader/${data.series.slug}/${data.series.chapters[0]?.chapterNumber}`,
      },
      numberOfPages: data.series.chapters.length,
      genre: data.series.genres.map((g) => g.genre.name).join(', '),
      image: data.series.coverImage,
      description: data.series.description,
      aggregateRating: data.averageRating ? {
        '@type': 'AggregateRating',
        ratingValue: data.averageRating,
        ratingCount: data.series.ratings.length,
        bestRating: Math.max(...data.series.ratings.map((r) => r.rating)),
        worstRating: Math.min(...data.series.ratings.map((r) => r.rating)),
      } : undefined,
    }

    const breadcrumbListSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Discover',
          item: `${baseUrl}/discover`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: data.series.title,
          item: `${baseUrl}/series/${data.series.slug}`,
        },
      ],
    }

    return NextResponse.json({
      '@context': 'https://schema.org',
      '@graph': [
        webSiteSchema,
        creativeWorkSchema,
        bookSchema,
        breadcrumbListSchema,
      ],
    })
  } catch (error: any) {
    console.error('Schema.org error:', error)
    return NextResponse.json(
      { error: 'Failed to generate schema.org' },
      { status: 500 }
    )
  }
}
