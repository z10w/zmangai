import { requireModerator } from '@/lib/auth-utils'
import { db } from '@/lib/db'

async function getPlatformStats() {
  const [
    totalUsers,
    totalSeries,
    totalChapters,
    totalViews,
    totalComments,
    activeUsersToday,
    activeUsersThisWeek,
  ] = await Promise.all([
    db.user.count(),
    db.series.count(),
    db.chapter.count(),
    db.series.aggregate({
      _sum: { views: true },
    }),
    db.comment.count(),
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    }),
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ])

  return {
    totalUsers,
    totalSeries,
    totalChapters,
    totalViews: totalViews._sum.views || 0,
    totalComments,
    activeUsersToday,
    activeUsersThisWeek,
  }
}

async function getSeriesStats(seriesId?: string) {
  const seriesIdWhere = seriesId
    ? { seriesId }
    : undefined

  const [seriesData, chapterStats, viewStats, engagementStats] = await Promise.all([
    // Series data
    seriesId
      ? db.series.findUnique({
          where: { id: seriesId },
          include: {
            _count: {
              select: { chapters: true, follows: true },
            },
          },
        })
      : null,

    // Chapter statistics
    db.chapter.groupBy({
      where: seriesIdWhere,
      by: ['isPublished', 'isScheduledFor'],
      _count: true,
      orderBy: { createdAt: 'desc' },
    }),

    // View statistics by time period
    Promise.all([
      db.history.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          series: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        },
      }),
      db.history.groupBy({
        by: ['createdAt'],
        _count: true,
        where: {
          series: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
        },
      }),
    ]),

    // Engagement statistics
    Promise.all([
      db.comment.count({
        where: seriesIdWhere,
      }),
      db.rating.aggregate({
        where: seriesIdWhere,
        _avg: { rating: true },
        _count: true,
      }),
      db.review.count({
        where: seriesIdWhere,
      }),
    ]),
  ])

  return {
    seriesData,
    chapterStats,
    viewStats,
    engagementStats,
  }
}

async function getCreatorStats(creatorId: string) {
  const [seriesStats, chapterStats, viewStats, followerStats, revenueStats] = await Promise.all([
    // Series statistics
    db.series.aggregate({
      where: { creatorId },
      _count: true,
      _sum: { views: true },
      _avg: { rating: true },
    }),

    // Chapter statistics
    db.chapter.aggregate({
      where: { authorId: creatorId },
      _count: true,
      _sum: { views: true },
    }),

    // View statistics
    db.history.groupBy({
      by: ['createdAt'],
      _count: true,
      where: {
        series: { creatorId },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    }),

    // Follower statistics
    db.follow.aggregate({
      where: { series: { creatorId } },
      _count: true,
    }),

    // Revenue statistics (placeholder for monetization feature)
    Promise.resolve({ total: 0, thisMonth: 0 }),
  ])

  return {
    seriesStats,
    chapterStats,
    viewStats,
    followerStats,
    revenueStats,
  }
}

// GET /api/analytics/overview - Get platform overview
export async function GET(req: NextRequest) {
  try {
    await requireModerator()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d' // 7d, 30d, 90d, 1y

    let startDate = new Date()
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        break
    }

    const platformStats = await getPlatformStats()

    // Calculate trends
    const viewsOverTime = await db.history.groupBy({
      by: ['createdAt'],
      _count: true,
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    })

    const usersOverTime = await db.user.groupBy({
      by: ['createdAt'],
      _count: true,
      where: {
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json({
      platform: {
        current: platformStats,
        trends: {
          views: viewsOverTime,
          users: usersOverTime,
        },
      },
    })
  } catch (error: any) {
    console.error('Analytics overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

// GET /api/analytics/series/:id - Get series analytics
export async function GET_series(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireModerator()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d'

    const stats = await getSeriesStats(params.id)

    return NextResponse.json({ stats, period })
  } catch (error: any) {
    console.error('Series analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch series analytics' },
      { status: 500 }
    )
  }
}

// GET /api/analytics/creator/:id - Get creator analytics
export async function GET_creator(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await requireModerator()

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '30d'

    // Only creators can see their own full analytics, moderators can see all
    if (currentUser.role !== 'ADMIN' && currentUser.role !== 'MODERATOR' && currentUser.id !== params.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const stats = await getCreatorStats(params.id)

    return NextResponse.json({ stats, period })
  } catch (error: any) {
    console.error('Creator analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creator analytics' },
      { status: 500 }
    )
  }
}

// GET /api/analytics/popular - Get popular content analytics
export async function GET_popular(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const timeRange = searchParams.get('timeRange') || '7d' // 7d, 30d, 90d

    let startDate = new Date()
    switch (timeRange) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        break
    }

    const [popularSeries, popularChapters, popularGenres, trendingTags] = await Promise.all([
      // Popular series
      db.series.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        include: {
          _count: {
            select: { chapters: true, follows: true, history: true },
          },
        },
        orderBy: {
          history: { _count: 'desc' },
        },
        take: limit,
      }),

      // Popular chapters
      db.chapter.findMany({
        where: {
          createdAt: { gte: startDate },
        },
        include: {
          series: {
            select: {
              id: true,
              title: true,
              slug: true,
              coverImage: true,
            },
          },
          _count: {
            select: { history: true },
          },
        },
        orderBy: {
          history: { _count: 'desc' },
        },
        take: limit,
      }),

      // Popular genres
      db.seriesGenre.groupBy({
        by: ['genreId'],
        _count: true,
        where: {
          series: { createdAt: { gte: startDate } },
        },
        orderBy: { _count: 'desc' },
        take: 10,
      }),

      // Trending tags
      db.seriesTag.groupBy({
        by: ['tagId'],
        _count: true,
        where: {
          series: { createdAt: { gte: startDate } },
        },
        orderBy: { _count: 'desc' },
        take: 10,
      }),
    ])

    // Fetch genre and tag names
    const [genreNames, tagNames] = await Promise.all([
      db.genre.findMany({
        where: {
          id: { in: popularGenres.map((g) => g.genreId) },
        },
      }),
      db.tag.findMany({
        where: {
          id: { in: trendingTags.map((t) => t.tagId) },
        },
      }),
    ])

    // Map genre and tag IDs to names
    const popularGenresWithNames = popularGenres.map((g) => ({
      genreId: g.genreId,
      count: g._count,
      name: genreNames.find((genre) => genre.id === g.genreId)?.name || 'Unknown',
    }))

    const trendingTagsWithNames = trendingTags.map((t) => ({
      tagId: t.tagId,
      count: t._count,
      name: tagNames.find((tag) => tag.id === t.tagId)?.name || 'Unknown',
    }))

    return NextResponse.json({
      popular: {
        series: popularSeries.map((s) => ({
          id: s.id,
          title: s.title,
          slug: s.slug,
          coverImage: s.coverImage,
          views: s._count.history,
          chapters: s._count.chapters,
          follows: s._count.follows,
        })),
        chapters: popularChapters.map((c) => ({
          id: c.id,
          title: c.title,
          chapterNumber: c.chapterNumber,
          views: c._count.history,
          series: c.series,
        })),
        genres: popularGenresWithNames,
        tags: trendingTagsWithNames,
      },
      timeRange,
    })
  } catch (error: any) {
    console.error('Popular analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch popular analytics' },
      { status: 500 }
    )
  }
}
