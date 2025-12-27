import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, parseQueryParams, createChapterSchema, updateChapterSchema, chapterQuerySchema } from '@/lib/validations'
import { requireCreator, createAuditLog, requireOwnership, getCurrentUser } from '@/lib/auth-utils'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// GET /api/chapters - List chapters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const validation = parseQueryParams(searchParams, chapterQuerySchema)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error },
        { status: 400 }
      )
    }

    const { page, limit, seriesId } = validation.data

    const where: any = {
      isPublished: true,
    }

    if (seriesId) {
      where.seriesId = seriesId
    }

    const [chapters, total] = await Promise.all([
      db.chapter.findMany({
        where,
        include: {
          series: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
          _count: {
            select: { pages: true },
          },
        },
        orderBy: {
          chapterNumber: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.chapter.count({ where }),
    ])

    return NextResponse.json({
      chapters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Chapters list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chapters - Create new chapter
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const rateLimitResult = withRateLimit(req, rateLimitConfigs.createChapter, user?.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    const currentUser = await requireCreator()

    const validation = await parseRequestBody(req, createChapterSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify series ownership
    const series = await db.series.findUnique({
      where: { id: data.seriesId },
    })

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    await requireOwnership(currentUser.id, series.creatorId)

    // Create chapter
    const chapter = await db.chapter.create({
      data: {
        seriesId: data.seriesId,
        chapterNumber: data.chapterNumber,
        title: data.title,
        volume: data.volume,
        isPublished: data.isPublished,
        publishedAt: data.isPublished ? new Date() : null,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        authorId: currentUser.id,
      },
      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'CREATE',
      entityType: 'CHAPTER',
      entityId: chapter.id,
      details: JSON.stringify({ title: chapter.title, seriesId: series.title }),
      request: req,
    })

    return NextResponse.json({ chapter }, { status: 201 })
  } catch (error: any) {
    console.error('Create chapter error:', error)
    if (error.message === 'Unauthorized' || error.message === 'Insufficient permissions' || error.message.includes('permission')) {
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
