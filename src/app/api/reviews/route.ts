import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, createReviewSchema, updateReviewSchema } from '@/lib/validations'
import { requireAuth, createAuditLog, requireOwnership } from '@/lib/auth-utils'

// GET /api/reviews - Get reviews
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const { seriesId, page, limit } = {
      seriesId: searchParams.get('seriesId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }

    const where: any = {
      isDeleted: false,
    }

    if (seriesId) {
      where.seriesId = seriesId
    }

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          series: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.review.count({ where }),
    ])

    return NextResponse.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Reviews list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/reviews - Create new review
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const validation = await parseRequestBody(req, createReviewSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify series exists
    const series = await db.series.findUnique({
      where: { id: data.seriesId },
    })

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    // Create review
    const review = await db.review.create({
      data: {
        content: data.content,
        hasSpoiler: data.hasSpoiler,
        userId: currentUser.id,
        seriesId: data.seriesId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'CREATE',
      entityType: 'REVIEW',
      entityId: review.id,
      details: JSON.stringify({ seriesId: data.seriesId }),
      request: req,
    })

    return NextResponse.json({ review }, { status: 201 })
  } catch (error: any) {
    console.error('Create review error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
