import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, followSchema } from '@/lib/validations'
import { requireAuth, createAuditLog } from '@/lib/auth-utils'

// GET /api/follows - Get user's follows
export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const { searchParams } = new URL(req.url)
    const { page, limit } = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }

    const [follows, total] = await Promise.all([
      db.follow.findMany({
        where: {
          userId: currentUser.id,
        },
        include: {
          series: {
            include: {
              genres: {
                include: {
                  genre: true,
                },
              },
              _count: {
                select: {
                  chapters: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.follow.count({
        where: {
          userId: currentUser.id,
        },
      }),
    ])

    return NextResponse.json({
      follows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Follows list error:', error)
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

// POST /api/follows - Follow a series
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const validation = await parseRequestBody(req, followSchema)
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

    // Check if already following
    const existingFollow = await db.follow.findUnique({
      where: {
        userId_seriesId: {
          userId: currentUser.id,
          seriesId: data.seriesId,
        },
      },
    })

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this series' },
        { status: 409 }
      )
    }

    // Create follow
    const follow = await db.follow.create({
      data: {
        userId: currentUser.id,
        seriesId: data.seriesId,
      },
      include: {
        series: true,
      },
    })

    // Update series follower count
    await db.series.update({
      where: { id: data.seriesId },
      data: {
        followers: {
          increment: 1,
        },
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'CREATE',
      entityType: 'FOLLOW',
      entityId: follow.id,
      details: JSON.stringify({ seriesId: data.seriesId }),
      request: req,
    })

    return NextResponse.json({ follow }, { status: 201 })
  } catch (error: any) {
    console.error('Follow series error:', error)
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

// DELETE /api/follows - Unfollow a series
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const { searchParams } = new URL(req.url)
    const seriesId = searchParams.get('seriesId')

    if (!seriesId) {
      return NextResponse.json(
        { error: 'Series ID is required' },
        { status: 400 }
      )
    }

    const follow = await db.follow.findUnique({
      where: {
        userId_seriesId: {
          userId: currentUser.id,
          seriesId,
        },
      },
    })

    if (!follow) {
      return NextResponse.json(
        { error: 'Not following this series' },
        { status: 404 }
      )
    }

    await db.follow.delete({
      where: {
        userId_seriesId: {
          userId: currentUser.id,
          seriesId,
        },
      },
    })

    // Update series follower count
    await db.series.update({
      where: { id: seriesId },
      data: {
        followers: {
          decrement: 1,
        },
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'DELETE',
      entityType: 'FOLLOW',
      entityId: follow.id,
      details: JSON.stringify({ seriesId }),
      request: req,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unfollow series error:', error)
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
