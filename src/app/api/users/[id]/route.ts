import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, createAuditLog } from '@/lib/auth-utils'

// GET /api/users/[id] - Get current user profile
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth()

    if (params.id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: currentUser.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        bio: true,
        createdAt: true,
        isBanned: true,
        isMuted: true,
      },
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Get profile error:', error)
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

// PATCH /api/users/[id] - Update user profile
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = await requireAuth()

    if (params.id !== currentUser.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const formData = await req.formData()
    const username = formData.get('username') as string | null
    const bio = formData.get('bio') as string | null
    const avatar = formData.get('avatar') as string | null

    const data: any = {}
    if (username) data.username = username
    if (bio) data.bio = bio
    if (avatar) data.avatar = avatar

    // Update user
    const user = await db.user.update({
      where: { id: currentUser.id },
      data,
    })

    // Create audit log
    await createAuditLog({
      userId: currentUser.id,
      action: 'UPDATE',
      entityType: 'USER',
      entityId: user.id,
      details: JSON.stringify(Object.keys(data)),
      request: req,
    })

    return NextResponse.json({ user })
  } catch (error: any) {
    console.error('Update profile error:', error)
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
