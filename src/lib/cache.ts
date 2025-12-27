import { unstable_cache } from 'next/cache'

// Cache keys for different types of data
export const CACHE_KEYS = {
  SERIES: 'series',
  CHAPTER: 'chapter',
  PAGE: 'page',
  USER: 'user',
  GENRE: 'genre',
  TAG: 'tag',
  COMMENT: 'comment',
  RATING: 'rating',
  REVIEW: 'review',
  FOLLOW: 'follow',
  PROGRESS: 'progress',
} as const

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  SHORT: 60, // 1 minute
  MEDIUM: 300, // 5 minutes
  LONG: 1800, // 30 minutes
  VERY_LONG: 3600, // 1 hour
} as const

// Series cache helpers
export async function getCachedSeries(id: string) {
  return unstable_cache(
    `series-${id}`,
    async () => {
      const { db } = await import('@/lib/db')
      return db.series.findUnique({
        where: { id },
        include: {
          creator: { select: { id: true, username: true, avatar: true } },
          genres: { include: { genre: true }, take: 3 },
          tags: { include: { tag: true }, take: 5 },
          _count: { select: { chapters: true, follows: true } },
        },
      })
    },
    {
      revalidate: CACHE_TTL.MEDIUM,
      tags: [CACHE_KEYS.SERIES, id],
    }
  )
}

export async function getCachedSeriesList(filters: any = {}) {
  const cacheKey = `series-list-${JSON.stringify(filters)}`

  return unstable_cache(
    cacheKey,
    async () => {
      const { db } = await import('@/lib/db')
      return db.series.findMany({
        where: filters.where,
        orderBy: filters.orderBy,
        take: filters.take || 24,
        skip: filters.skip || 0,
        include: {
          _count: { select: { chapters: true, follows: true } },
        },
      })
    },
    {
      revalidate: CACHE_TTL.SHORT,
      tags: [CACHE_KEYS.SERIES, 'list'],
    }
  )
}

// Chapter cache helpers
export async function getCachedChapter(id: string) {
  return unstable_cache(
    `chapter-${id}`,
    async () => {
      const { db } = await import('@/lib/db')
      return db.chapter.findUnique({
        where: { id },
        include: {
          series: { select: { id: true, title: true, slug: true, coverImage: true } },
          pages: { orderBy: { order: 'asc' }, take: 100 },
        },
      })
    },
    {
      revalidate: CACHE_TTL.MEDIUM,
      tags: [CACHE_KEYS.CHAPTER, id],
    }
  )
}

export async function getCachedChaptersBySeries(seriesId: string) {
  return unstable_cache(
    `chapters-series-${seriesId}`,
    async () => {
      const { db } = await import('@/lib/db')
      return db.chapter.findMany({
        where: { seriesId },
        orderBy: { chapterNumber: 'desc' },
        include: {
          _count: { select: { pages: true } },
        },
        take: 50,
      })
    },
    {
      revalidate: CACHE_TTL.MEDIUM,
      tags: [CACHE_KEYS.CHAPTER, 'series', seriesId],
    }
  )
}

// User cache helpers
export async function getCachedUser(id: string) {
  return unstable_cache(
    `user-${id}`,
    async () => {
      const { db } = await import('@/lib/db')
      return db.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          role: true,
          createdAt: true,
          bio: true,
        },
      })
    },
    {
      revalidate: CACHE_TTL.LONG,
      tags: [CACHE_KEYS.USER, id],
    }
  )
}

// Cache invalidation helpers
export function invalidateSeriesCache(id?: string, seriesId?: string) {
  if (id) {
    unstable_cache.revalidateTag(CACHE_KEYS.SERIES, id)
  }
  if (seriesId) {
    unstable_cache.revalidateTag(CACHE_KEYS.SERIES, seriesId)
  }
}

export function invalidateChapterCache(id?: string, seriesId?: string) {
  if (id) {
    unstable_cache.revalidateTag(CACHE_KEYS.CHAPTER, id)
  }
  if (seriesId) {
    unstable_cache.revalidateTag(CACHE_KEYS.CHAPTER, `series-${seriesId}`)
  }
}

export function invalidateUserCache(id: string) {
  unstable_cache.revalidateTag(CACHE_KEYS.USER, id)
}

export function invalidateAllCache() {
  unstable_cache.revalidateTag(CACHE_KEYS.SERIES)
  unstable_cache.revalidateTag(CACHE_KEYS.CHAPTER)
  unstable_cache.revalidateTag(CACHE_KEYS.PAGE)
  unstable_cache.revalidateTag(CACHE_KEYS.USER)
  unstable_cache.revalidateTag(CACHE_KEYS.GENRE)
  unstable_cache.revalidateTag(CACHE_KEYS.TAG)
  unstable_cache.revalidateTag(CACHE_KEYS.COMMENT)
  unstable_cache.revalidateTag(CACHE_KEYS.RATING)
  unstable_cache.revalidateTag(CACHE_KEYS.REVIEW)
  unstable_cache.revalidateTag(CACHE_KEYS.FOLLOW)
  unstable_cache.revalidateTag(CACHE_KEYS.PROGRESS)
}
