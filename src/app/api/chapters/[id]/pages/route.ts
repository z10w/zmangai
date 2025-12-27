import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, createPageSchema } from '@/lib/validations'
import { requireCreator, createAuditLog, requireOwnership, getCurrentUser } from '@/lib/auth-utils'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

// GET /api/chapters/[id]/pages - Get pages for a chapter
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const pages = await db.page.findMany({
      where: {
        chapterId: id,
      },
      orderBy: {
        order: 'asc',
      },
    })

    return NextResponse.json({ pages })
  } catch (error) {
    console.error('Pages list error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/chapters/[id]/pages - Upload pages to a chapter
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireCreator()
    const { id } = params
    const user = await getCurrentUser()
    const rateLimitResult = withRateLimit(req, rateLimitConfigs.upload, user?.id)

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Verify chapter ownership
    const chapter = await db.chapter.findUnique({
      where: { id },
      include: {
        series: true,
      },
    })

    if (!chapter) {
      return NextResponse.json(
        { error: 'Chapter not found' },
        { status: 404 }
      )
    }

    await requireOwnership(currentUser.id, chapter.series.creatorId)

    // Create pages
    const pages = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const order = i + 1

      // For now, we'll use a placeholder URL since we can't actually process files without the upload endpoint
      const page = await db.page.create({
        data: {
          chapterId: id,
          imageUrl: `/uploads/chapters/${chapter.series.slug}/${id}/${order}.jpg`,
          order,
        },
      })

      pages.push(page)
    }

    // Update chapter page count
    await db.chapter.update({
      where: { id },
      data: {
        pageCount: pages.length,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'CREATE',
      entityType: 'PAGE',
      details: JSON.stringify({ chapterId: id, pageCount: pages.length }),
      request: req,
    })

    return NextResponse.json({ pages }, { status: 201 })
  } catch (error: any) {
    console.error('Create pages error:', error)
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
