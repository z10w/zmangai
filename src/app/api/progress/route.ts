import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, updateProgressSchema } from '@/lib/validations'
import { requireAuth, createAuditLog } from '@/lib/auth-utils'

// GET /api/progress - Get user's reading progress
export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const { searchParams } = new URL(req.url)
    const { chapterId, seriesId } = {
      chapterId: searchParams.get('chapterId') || undefined,
      seriesId: searchParams.get('seriesId') || undefined,
    }

    const where: any = {
      userId: currentUser.id,
    }

    if (chapterId) {
      where.chapterId = chapterId
    }

    let progress

    if (seriesId) {
      // Get latest progress for a series
      const progressList = await db.readingProgress.findMany({
        where,
        include: {
          chapter: {
            include: {
              series: true,
            },
          },
        },
        orderBy: {
          lastReadAt: 'desc',
        },
        take: 10,
      })
      progress = progressList
    } else if (chapterId) {
      // Get progress for a specific chapter
      progress = await db.readingProgress.findUnique({
        where: {
          userId_chapterId: {
            userId: currentUser.id,
            chapterId,
          },
        },
        include: {
          chapter: {
            include: {
              series: true,
            },
          },
        },
      })
    } else {
      // Get all recent progress
      progress = await db.readingProgress.findMany({
        where,
        include: {
          chapter: {
            include: {
              series: true,
            },
          },
        },
        orderBy: {
          lastReadAt: 'desc',
        },
        take: 50,
      })
    }

    return NextResponse.json({ progress })
  } catch (error: any) {
    console.error('Progress list error:', error)
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

// POST /api/progress - Update reading progress
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const validation = await parseRequestBody(req, updateProgressSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify chapter exists
    const chapter = await db.chapter.findUnique({
      where: { id: data.chapterId },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Create or update progress
    const progress = await db.readingProgress.upsert({
      where: {
        userId_chapterId: {
          userId: currentUser.id,
          chapterId: data.chapterId,
        },
      },
      update: {
        pageIndex: data.pageIndex,
        scrollOffset: data.scrollOffset,
        isCompleted: data.isCompleted,
        lastReadAt: new Date(),
      },
      create: {
        userId: currentUser.id,
        chapterId: data.chapterId,
        pageIndex: data.pageIndex || 0,
        scrollOffset: data.scrollOffset || 0,
        isCompleted: data.isCompleted || false,
        lastReadAt: new Date(),
      },
      include: {
        chapter: true,
      },
    })

    // Add to history
    await db.history.create({
      data: {
        userId: currentUser.id,
        seriesId: chapter.seriesId,
        chapterId: data.chapterId,
      },
    })

    return NextResponse.json({ progress })
  } catch (error: any) {
    console.error('Update progress error:', error)
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
