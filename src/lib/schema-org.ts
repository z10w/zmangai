import { db } from '@/lib/db'

// Get series data for schema.org
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

export async function generateSeriesSchemaGraph(slug: string) {
  const data = await getSeriesSchemaData(slug)

  if (!data) {
    return null
  }

  const { series, averageRating } = data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mangaverse.com'

  // Schema.org WebSite
  const webSiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/series/${series.slug}`,
    url: `${baseUrl}/series/${series.slug}`,
    name: series.title,
    description: series.description || `Read ${series.title} on MangaVerse`,
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

  // Schema.org CreativeWork
  const creativeWorkSchema = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${baseUrl}/series/${series.slug}#creative`,
    name: series.title,
    description: series.description,
    author: {
      '@type': 'Person',
      name: series.author,
      url: `${baseUrl}/creators/${series.creator.username}`,
    },
    image: series.coverImage,
    genre: series.genres.map((g) => g.genre.name).join(', '),
    keywords: series.genres.map((g) => g.genre.name).join(', '),
    datePublished: series.createdAt,
    isAccessibleForFree: true,
  }

  // Schema.org Book
  const bookSchema = {
    '@context': 'https://schema.org',
    '@type': 'Book',
    '@id': `${baseUrl}/series/${series.slug}#book`,
    name: series.title,
    author: {
      '@type': 'Person',
      name: series.author,
      url: `${baseUrl}/creators/${series.creator.username}`,
    },
    url: `${baseUrl}/series/${series.slug}`,
    workExample: {
      '@type': 'Book',
      name: `${series.title} Chapter ${series.chapters[0]?.chapterNumber}`,
      url: `${baseUrl}/reader/${series.slug}/${series.chapters[0]?.chapterNumber}`,
    },
    numberOfPages: 1, // Simplified - could be actual page count
    genre: series.genres.map((g) => g.genre.name).join(', '),
    image: series.coverImage,
    description: series.description,
    aggregateRating: averageRating ? {
      '@type': 'AggregateRating',
      ratingValue: averageRating,
      ratingCount: series.ratings.length,
      bestRating: Math.max(...series.ratings.map((r) => r.rating)),
      worstRating: Math.min(...series.ratings.map((r) => r.rating)),
    } : undefined,
  }

  // Schema.org BreadcrumbList
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
        name: series.title,
        item: `${baseUrl}/series/${series.slug}`,
      },
    ],
  }

  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      webSiteSchema,
      creativeWorkSchema,
      bookSchema,
      breadcrumbListSchema,
    ],
  })
}
