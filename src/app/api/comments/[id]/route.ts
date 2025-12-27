import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, updateCommentSchema } from '@/lib/validations'
import { requireAuth, createAuditLog, requireOwnership, requireModerator } from '@/lib/auth-utils'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// PATCH /api/comments/[id] - Update comment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = params
    const user = await getCurrentUser()

    const existingComment = await db.comment.findUnique({
      where: { id },
    })

    if (!existingComment || existingComment.isDeleted) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check ownership
    await requireOwnership(currentUser.id, existingComment.userId)

    // Validate input
    const validation = await parseRequestBody(req, updateCommentSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Update comment
    const comment = await db.comment.update({
      where: { id },
      data,
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'COMMENT',
      entityId: comment.id,
      details: JSON.stringify({ content: data.content }),
      request: req,
    })

    return NextResponse.json({ comment })
  } catch (error: any) {
    console.error('Update comment error:', error)
    if (error.message === 'Unauthorized' || error.message.includes('permission')) {
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

// DELETE /api/comments/[id] - Delete comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = params

    const existingComment = await db.comment.findUnique({
      where: { id },
    })

    if (!existingComment || existingComment.isDeleted) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check ownership or moderator rights
    const isOwner = existingComment.userId === currentUser.id
    const isModerator = currentUser.role === 'MODERATOR' || currentUser.role === 'ADMIN'

    if (!isOwner && !isModerator) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this comment' },
        { status: 403 }
      )
    }

    // Soft delete comment
    const comment = await db.comment.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'DELETE',
      entityType: 'COMMENT',
      entityId: existingComment.id,
      details: JSON.stringify({ wasOwner: isOwner }),
      request: req,
    })

    return NextResponse.json({ success: true, comment })
  } catch (error: any) {
    console.error('Delete comment error:', error)
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

// POST /api/comments/[id]/like - Like comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = params
    const user = await getCurrentUser()
    const rateLimitResult = withRateLimit(req, rateLimitConfigs.like, user?.id)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    const comment = await db.comment.findUnique({
      where: { id },
    })

    if (!comment || comment.isDeleted) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // Check if already liked
    const existingLike = await db.commentLike.findUnique({
      where: {
        userId_commentId: {
          userId: currentUser.id,
          commentId: id,
        },
      },
    })

    if (existingLike) {
      // Unlike
      await db.commentLike.delete({
        where: {
          userId_commentId: {
            userId: currentUser.id,
            commentId: id,
          },
        },
      })

      return NextResponse.json({ liked: false })
    }

    // Like
    await db.commentLike.create({
      data: {
        userId: currentUser.id,
        commentId: id,
      },
    })

    return NextResponse.json({ liked: true })
  } catch (error: any) {
    console.error('Like comment error:', error)
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
