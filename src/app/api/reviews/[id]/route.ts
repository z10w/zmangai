import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, updateReviewSchema } from '@/lib/validations'
import { requireAuth, createAuditLog, requireOwnership } from '@/lib/auth-utils'

// PATCH /api/reviews/[id] - Update review
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = params

    const existingReview = await db.review.findUnique({
      where: { id },
    })

    if (!existingReview || existingReview.isDeleted) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check ownership
    await requireOwnership(currentUser.id, existingReview.userId)

    // Validate input
    const validation = await parseRequestBody(req, updateReviewSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Update review
    const review = await db.review.update({
      where: { id },
      data,
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'REVIEW',
      entityId: review.id,
      request: req,
    })

    return NextResponse.json({ review })
  } catch (error: any) {
    console.error('Update review error:', error)
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

// DELETE /api/reviews/[id] - Delete review
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth()
    const { id } = params

    const existingReview = await db.review.findUnique({
      where: { id },
    })

    if (!existingReview || existingReview.isDeleted) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      )
    }

    // Check ownership
    await requireOwnership(currentUser.id, existingReview.userId)

    // Soft delete review
    const review = await db.review.update({
      where: { id },
      data: {
        isDeleted: true,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'DELETE',
      entityType: 'REVIEW',
      entityId: existingReview.id,
      request: req,
    })

    return NextResponse.json({ success: true, review })
  } catch (error: any) {
    console.error('Delete review error:', error)
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
