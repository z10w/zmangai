import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, requireOwnership, requireCreator, createAuditLog } from '@/lib/auth-utils'
import { parseRequestBody, updateSeriesSchema } from '@/lib/validations'

// GET /api/series/[slug] - Get series details
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    const user = await getCurrentUser()

    const series = await db.series.findUnique({
      where: { slug },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
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
        chapters: {
          where: {
            isPublished: true,
          },
          orderBy: {
            chapterNumber: 'desc',
          },
          include: {
            _count: {
              select: {
                pages: true,
              },
            },
          },
        },
      },
    })

    if (!series) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    // Check if user is following this series
    let isFollowing = false
    if (user) {
      const follow = await db.follow.findUnique({
        where: {
          userId_seriesId: {
            userId: user.id,
            seriesId: series.id,
          },
        },
      })
      isFollowing = !!follow
    }

    // Increment view count
    await db.series.update({
      where: { id: series.id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    // Get user's rating for this series
    let userRating = null
    if (user) {
      const rating = await db.rating.findUnique({
        where: {
          userId_seriesId: {
            userId: user.id,
            seriesId: series.id,
          },
        },
      })
      userRating = rating?.rating || null
    }

    return NextResponse.json({
      ...series,
      isFollowing,
      userRating,
    })
  } catch (error) {
    console.error('Series detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/series/[slug] - Update series
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const currentUser = await requireCreator()

    const { slug } = params

    const existingSeries = await db.series.findUnique({
      where: { slug },
    })

    if (!existingSeries) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    // Check ownership
    await requireOwnership(currentUser.id, existingSeries.creatorId)

    // Validate input
    const validation = await parseRequestBody(req, updateSeriesSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Update series
    const series = await db.series.update({
      where: { id: existingSeries.id },
      data: {
        ...data,
        genres: data.genreIds ? {
          deleteMany: {},
          create: data.genreIds.map((genreId) => ({
            genreId,
          })),
        } : undefined,
        tags: data.tagIds ? {
          deleteMany: {},
          create: data.tagIds.map((tagId) => ({
            tagId,
          })),
        } : undefined,
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
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'SERIES',
      entityId: series.id,
      details: JSON.stringify({ title: series.title, slug: series.slug }),
      request: req,
    })

    return NextResponse.json({ series })
  } catch (error: any) {
    console.error('Update series error:', error)
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

// DELETE /api/series/[slug] - Delete series
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const currentUser = await requireCreator()

    const { slug } = params

    const existingSeries = await db.series.findUnique({
      where: { slug },
    })

    if (!existingSeries) {
      return NextResponse.json(
        { error: 'Series not found' },
        { status: 404 }
      )
    }

    // Check ownership
    await requireOwnership(currentUser.id, existingSeries.creatorId)

    // Delete series (cascade will delete chapters, pages, etc.)
    await db.series.delete({
      where: { id: existingSeries.id },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'DELETE',
      entityType: 'SERIES',
      entityId: existingSeries.id,
      details: JSON.stringify({ title: existingSeries.title, slug: existingSeries.slug }),
      request: req,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete series error:', error)
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
