import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, parseQueryParams, createCommentSchema, updateCommentSchema, commentQuerySchema } from '@/lib/validations'
import { requireAuth, requireNotMuted, createAuditLog, requireOwnership } from '@/lib/auth-utils'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// GET /api/comments - List comments
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const { chapterId, page, limit } = {
      chapterId: searchParams.get('chapterId') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
    }

    const where: any = {
      isDeleted: false,
    }

    if (chapterId) {
      where.chapterId = chapterId
      // Only get top-level comments, not replies
      where.parentId = null
    }

    const [comments, total] = await Promise.all([
      db.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          replies: {
            where: {
              isDeleted: false,
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              _count: {
                select: { likes: true },
              },
            },
            take: 3,
          },
          _count: {
            select: { likes: true, replies: true },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.comment.count({ where }),
    ])

    // Check if current user liked any comments
    const currentUser = await getCurrentUser()
    let likedCommentIds: Set<string> = new Set()

    if (currentUser && comments.length > 0) {
      const likes = await db.commentLike.findMany({
        where: {
          userId: currentUser.id,
          commentId: {
            in: comments.map(c => c.id),
          },
        },
        select: {
          commentId: true,
        },
      })

      likedCommentIds = new Set(likes.map(l => l.commentId))
    }

    // Add liked status to comments
    const commentsWithLikeStatus = comments.map(comment => ({
      ...comment,
      isLiked: likedCommentIds.has(comment.id),
      replies: comment.replies.map(reply => ({
        ...reply,
        isLiked: likedCommentIds.has(reply.id),
      })),
    }))

    return NextResponse.json({
      comments: commentsWithLikeStatus,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Comments list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/comments - Create new comment
export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireAuth()
    await requireNotMuted()

    const user = await getCurrentUser()
    const rateLimitResult = withRateLimit(req, rateLimitConfigs.comment, user?.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    const validation = await parseRequestBody(req, createCommentSchema)
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

    // If parentId is provided, verify it exists and belongs to the same chapter
    if (data.parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: data.parentId },
      })

      if (!parentComment || parentComment.chapterId !== data.chapterId) {
        return NextResponse.json(
          { error: 'Parent comment not found or invalid' },
          { status: 400 }
        )
      }

      // Check reply depth (max 2 levels)
      if (parentComment.parentId) {
        return NextResponse.json(
          { error: 'Maximum reply depth exceeded' },
          { status: 400 }
        )
      }
    }

    // Create comment
    const comment = await db.comment.create({
      data: {
        content: data.content,
        hasSpoiler: data.hasSpoiler,
        userId: currentUser.id,
        chapterId: data.chapterId,
        parentId: data.parentId,
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
      entityType: 'COMMENT',
      entityId: comment.id,
      details: JSON.stringify({ chapterId: data.chapterId, hasSpoiler: data.hasSpoiler }),
      request: req,
    })

    return NextResponse.json({ comment }, { status: 201 })
  } catch (error: any) {
    console.error('Create comment error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    if (error.message.includes('muted')) {
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
