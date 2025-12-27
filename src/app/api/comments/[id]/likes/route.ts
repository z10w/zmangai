import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, createAuditLog } from '@/lib/auth-utils'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// POST /api/comments/[id]/likes - Like a comment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const user = await getCurrentUser()
    const rateLimitResult = withRateLimit(req, rateLimitConfigs.like, user?.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    const currentUser = await requireAuth()

    const { id: commentId } = params

    // Verify comment exists
    const comment = await db.comment.findUnique({
      where: { id: commentId },
    })

    if (!comment) {
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
          commentId,
        },
      },
    })

    if (existingLike) {
      return NextResponse.json(
        { error: 'Already liked this comment' },
        { status: 409 }
      )
    }

    // Create like
    await db.commentLike.create({
      data: {
        userId: currentUser.id,
        commentId,
      },
    })

    return NextResponse.json({ success: true }, { status: 201 })
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

// DELETE /api/comments/[id]/likes - Unlike a comment
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth()

    const { id: commentId } = params

    // Delete like
    await db.commentLike.deleteMany({
      where: {
        userId: currentUser.id,
        commentId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Unlike comment error:', error)
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
