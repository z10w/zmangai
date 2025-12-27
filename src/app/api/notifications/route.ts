import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, markNotificationReadSchema } from '@/lib/validations'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/notifications - Get user's notifications
export async function GET(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const { searchParams } = new URL(req.url)
    const { page, limit, unreadOnly } = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      unreadOnly: searchParams.get('unreadOnly'),
    }

    const where: any = {
      userId: currentUser.id,
    }

    if (unreadOnly === 'true') {
      where.isRead = false
    }

    const [notifications, total] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.notification.count({ where }),
    ])

    // Get unread count
    const unreadCount = await db.notification.count({
      where: {
        userId: currentUser.id,
        isRead: false,
      },
    })

    return NextResponse.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    })
  } catch (error: any) {
    console.error('Notifications list error:', error)
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

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const validation = await parseRequestBody(req, markNotificationReadSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    if (data.markAll) {
      // Mark all as read
      await db.notification.updateMany({
        where: {
          userId: currentUser.id,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, marked: 'all' })
    }

    if (data.notificationIds && data.notificationIds.length > 0) {
      // Mark specific notifications as read
      await db.notification.updateMany({
        where: {
          id: {
            in: data.notificationIds,
          },
          userId: currentUser.id,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      })

      return NextResponse.json({ success: true, marked: 'selected' })
    }

    return NextResponse.json(
      { error: 'No valid parameters provided' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Mark notifications error:', error)
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

// DELETE /api/notifications - Clear read notifications
export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const { searchParams } = new URL(req.url)
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30')

    // Delete notifications older than X days
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    await db.notification.deleteMany({
      where: {
        userId: currentUser.id,
        createdAt: {
          lt: cutoffDate,
        },
        isRead: true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Clear notifications error:', error)
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
