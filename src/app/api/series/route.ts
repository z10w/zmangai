import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseQueryParams, seriesQuerySchema } from '@/lib/validations'
import { getCachedSeriesList, invalidateSeriesCache, CACHE_TTL } from '@/lib/cache'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { createAuditLog, requireModerator } from '@/lib/auth-utils'

// GET /api/series - List series with filtering, sorting, and caching
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const validation = parseQueryParams(searchParams, seriesQuerySchema)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error },
        { status: 400 }
      )
    }

    const { page, limit, genre, type, status, sort, search, mature } = validation.data

    // Build cache key based on filters
    const filters: any = {
      where: {},
      orderBy: {},
    }

    if (genre) {
      filters.where.genres = {
        some: {
          genre: { slug: genre },
        },
      }
    }

    if (type) {
      filters.where.type = type
    }

    if (status) {
      filters.where.status = status
    }

    if (search) {
      filters.where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (mature !== 'both') {
      filters.where.isMature = mature === 'true'
    }

    // Build order by
    let orderBy: any = { createdAt: 'desc' }
    switch (sort) {
      case 'popular':
        orderBy = { views: 'desc' }
        break
      case 'rating':
        orderBy = [{ rating: 'desc' }, { ratingCount: 'desc' }]
        break
      case 'alphabetical':
        orderBy = { title: 'asc' }
        break
      case 'latest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    filters.orderBy = orderBy
    filters.take = limit
    filters.skip = (page - 1) * limit

    // Use cached data with proper revalidation
    const { series, total } = await getCachedSeriesList(filters)

    // Include full data for first page only (more efficient)
    const enrichedSeries = page === 1
      ? series
      : series.map((s) => ({ id: s.id, slug: s.slug, title: s.title, coverImage: s.coverImage, type: s.type, status: s.status, views: s.views, rating: s.rating, ratingCount: s.ratingCount }))

    // Add caching headers
    const cacheTags = [
      `public, max-age=${CACHE_TTL.SHORT}`, // Browser cache
      `s-maxage=${CACHE_TTL.MEDIUM}`, // Shared cache
    ]

    return NextResponse.json(
      {
        series: enrichedSeries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        cached: page > 1, // First page is fresh, others are cached
      },
      {
        headers: {
          'Cache-Control': cacheTags.join(', '),
          'X-Cache-Status': page > 1 ? 'HIT' : 'MISS',
        },
      }
    )
  } catch (error: any) {
    console.error('Series list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/series - Create new series with cache invalidation
export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const user = await requireModerator()
    const rateLimitResult = withRateLimit(req, rateLimitConfigs.createSeries, user?.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    // Validate request body
    const body = await req.json()
    const validation = parseRequestBody(req, createSeriesSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if slug already exists
    const existingSeries = await db.series.findUnique({
      where: { slug },
    })

    if (existingSeries) {
      return NextResponse.json(
        { error: 'A series with this title already exists' },
        { status: 409 }
      )
    }

    // Create series
    const series = await db.series.create({
      data: {
        slug,
        title: data.title.trim(),
        alternativeTitles: data.alternativeTitles?.trim() || null,
        description: data.description?.trim() || null,
        coverImage: data.coverImage || '/uploads/default-cover.jpg',
        bannerImage: data.bannerImage || null,
        author: data.author.trim(),
        artist: data.artist?.trim() || null,
        type: data.type,
        status: data.status,
        language: data.language || 'en',
        isMature: data.isMature || false,
        creatorId: user.id,
        views: 0,
        rating: 0,
        ratingCount: 0,
        followers: 0,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
      },
      include: {
        genres: {
          include: {
            genre: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SERIES',
      entityId: series.id,
      details: JSON.stringify({ title: series.title, slug: series.slug }),
      request: req,
    })

    // Invalidate series list cache
    await invalidateSeriesCache()

    // Create genre and tag relationships
    if (data.genreIds && data.genreIds.length > 0) {
      await db.seriesGenre.createMany({
        data: data.genreIds.map((genreId) => ({
          seriesId: series.id,
          genreId,
        })),
        skipDuplicates: true,
      })
    }

    if (data.tagIds && data.tagIds.length > 0) {
      await db.seriesTag.createMany({
        data: data.tagIds.map((tagId) => ({
          seriesId: series.id,
          tagId,
        })),
        skipDuplicates: true,
      })
    }

    // Add caching headers
    const cacheTags = [
      'public',
      'no-cache', // Don't cache POST requests
    ]

    return NextResponse.json(
      {
        series: {
          id: series.id,
          slug: series.slug,
          title: series.title,
          message: 'Series created successfully',
        },
      },
      {
        headers: {
          'Cache-Control': cacheTags.join(', '),
        },
      }
    )
  } catch (error: any) {
    console.error('Create series error:', error)
    if (error.message === 'Unauthorized' || error.message === 'Insufficient permissions') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
