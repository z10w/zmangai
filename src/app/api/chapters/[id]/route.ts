import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, updateChapterSchema } from '@/lib/validations'
import { requireCreator, createAuditLog, requireOwnership } from '@/lib/auth-utils'

// GET /api/chapters/[id] - Get chapter details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const chapter = await db.chapter.findUnique({
      where: { id },
      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
          },
        },
        pages: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: { pages: true },
        },
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await db.chapter.update({
      where: { id },
      data: {
        views: {
          increment: 1,
        },
      },
    })

    return NextResponse.json({ chapter })
  } catch (error) {
    console.error('Chapter detail error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/chapters/[id] - Update chapter
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireCreator()
    const { id } = params

    const existingChapter = await db.chapter.findUnique({
      where: { id },
      include: {
        series: true,
      },
    })

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Check ownership
    await requireOwnership(currentUser.id, existingChapter.series.creatorId)

    // Validate input
    const validation = await parseRequestBody(req, updateChapterSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Update chapter
    const chapter = await db.chapter.update({
      where: { id },
      data: {
        ...data,
        publishedAt: data.isPublished && !existingChapter.isPublished ? new Date() : undefined,
      },
      include: {
        series: {
          select: {
            id: true,
            title: true,
            slug: true,
          },
        },
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'CHAPTER',
      entityId: chapter.id,
      details: JSON.stringify({ title: chapter.title }),
      request: req,
    })

    return NextResponse.json({ chapter })
  } catch (error: any) {
    console.error('Update chapter error:', error)
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

// DELETE /api/chapters/[id] - Delete chapter
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireCreator()
    const { id } = params

    const existingChapter = await db.chapter.findUnique({
      where: { id },
      include: {
        series: true,
      },
    })

    if (!existingChapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    // Check ownership
    await requireOwnership(currentUser.id, existingChapter.series.creatorId)

    // Delete chapter (cascade will delete pages)
    await db.chapter.delete({
      where: { id },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'DELETE',
      entityType: 'CHAPTER',
      entityId: existingChapter.id,
      details: JSON.stringify({ title: existingChapter.title }),
      request: req,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete chapter error:', error)
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
