import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, createReportSchema, updateReportSchema } from '@/lib/validations'
import { requireAuth, createAuditLog, requireModerator } from '@/lib/auth-utils'

// GET /api/reports - Get reports (moderator/admin only)
export async function GET(req: NextRequest) {
  try {
    await requireModerator()

    const { searchParams } = new URL(req.url)
    const { page, limit, status, type } = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
    }

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const [reports, total] = await Promise.all([
      db.report.findMany({
        where,
        include: {
          reporter: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          comment: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
          series: {
            select: {
              id: true,
              title: true,
            },
          },
          chapter: {
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
      db.report.count({ where }),
    ])

    return NextResponse.json({
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error: any) {
    console.error('Reports list error:', error)
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

// POST /api/reports - Create new report
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth()

    const validation = await parseRequestBody(req, createReportSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Verify entity exists
    let entityExists = false
    if (data.type === 'COMMENT') {
      const comment = await db.comment.findUnique({ where: { id: data.entityId } })
      entityExists = !!comment
    } else if (data.type === 'SERIES') {
      const series = await db.series.findUnique({ where: { id: data.entityId } })
      entityExists = !!series
    } else if (data.type === 'CHAPTER') {
      const chapter = await db.chapter.findUnique({ where: { id: data.entityId } })
      entityExists = !!chapter
    } else if (data.type === 'USER') {
      const user = await db.user.findUnique({ where: { id: data.entityId } })
      entityExists = !!user
    }

    if (!entityExists) {
      return NextResponse.json(
        { error: 'Entity not found' },
        { status: 404 }
      )
    }

    // Create report
    const report = await db.report.create({
      data: {
        type: data.type,
        entityId: data.entityId,
        reason: data.reason,
        description: data.description,
        reporterId: currentUser.id,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'CREATE',
      entityType: 'REPORT',
      entityId: report.id,
      details: JSON.stringify({ type: data.type, entityId: data.entityId }),
      request: req,
    })

    return NextResponse.json({ report }, { status: 201 })
  } catch (error: any) {
    console.error('Create report error:', error)
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
