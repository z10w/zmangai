import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseRequestBody, updateReportSchema } from '@/lib/validations'
import { requireModerator, createAuditLog } from '@/lib/auth-utils'

// PATCH /api/reports/[id] - Update report status (moderator/admin only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireModerator()
    const { id } = params

    const existingReport = await db.report.findUnique({
      where: { id },
    })

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      )
    }

    const validation = await parseRequestBody(req, updateReportSchema)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error },
        { status: 400 }
      )
    }

    const data = validation.data

    // Update report
    const report = await db.report.update({
      where: { id },
      data: {
        status: data.status,
        reviewedBy: currentUser.id,
        reviewedAt: new Date(),
        notes: data.notes,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'REPORT',
      entityId: report.id,
      details: JSON.stringify({ status: data.status, notes: data.notes }),
      request: req,
    })

    return NextResponse.json({ report })
  } catch (error: any) {
    console.error('Update report error:', error)
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
