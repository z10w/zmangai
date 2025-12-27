import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, createRatingSchema, updateRatingSchema } from '@/lib/validations'
import { requireAuth, createAuditLog } from '@/lib/auth-utils'

// GET /api/ratings - Get ratings
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const { seriesId } = {
      seriesId: searchParams.get('seriesId') || undefined,
    }

    const where: any = {}

    if (seriesId) {
      where.seriesId = seriesId
    }

    const ratings = await db.rating.findMany({
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
      take: 100,
    })

    return NextResponse.json({ ratings })
  } catch (error) {
    console.error('Ratings list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/ratings - Create or update rating
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const validation = await parseRequestBody(req, createRatingSchema)
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

    // Check if user already rated this series
    const existingRating = await db.rating.findUnique({
      where: {
        userId_seriesId: {
          userId: currentUser.id,
          seriesId: data.seriesId,
        },
      },
    })

    let rating
    if (existingRating) {
      // Update existing rating
      rating = await db.rating.update({
        where: {
          userId_seriesId: {
            userId: currentUser.id,
            seriesId: data.seriesId,
          },
        },
        data: {
          rating: data.rating,
        },
      })
    } else {
      // Create new rating
      rating = await db.rating.create({
        data: {
          userId: currentUser.id,
          seriesId: data.seriesId,
          rating: data.rating,
        },
      })

      // Update series rating count and average
      await updateSeriesRating(data.seriesId)
    }

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: existingRating ? 'UPDATE' : 'CREATE',
      entityType: 'RATING',
      entityId: rating.id,
      details: JSON.stringify({ seriesId: data.seriesId, rating: data.rating }),
      request: req,
    })

    return NextResponse.json({ rating })
  } catch (error: any) {
    console.error('Create rating error:', error)
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

// Helper function to update series rating
async function updateSeriesRating(seriesId: string) {
  const ratings = await db.rating.findMany({
    where: { seriesId },
    select: { rating: true },
  })

  if (ratings.length === 0) return

  const average = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length

  await db.series.update({
    where: { id: seriesId },
    data: {
      rating: Math.round(average * 10) / 10, // Round to 1 decimal
      ratingCount: ratings.length,
    },
  })
}

// DELETE /api/ratings - Delete rating
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

    const rating = await db.rating.findUnique({
      where: {
        userId_seriesId: {
          userId: currentUser.id,
          seriesId,
        },
      },
    })

    if (!rating) {
      return NextResponse.json(
        { error: 'Rating not found' },
        { status: 404 }
      )
    }

    await db.rating.delete({
      where: {
        userId_seriesId: {
          userId: currentUser.id,
          seriesId,
        },
      },
    })

    // Update series rating
    await updateSeriesRating(seriesId)

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'DELETE',
      entityType: 'RATING',
      entityId: rating.id,
      details: JSON.stringify({ seriesId }),
      request: req,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete rating error:', error)
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
