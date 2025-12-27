import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { db } from './db'
import { UserRole } from '@prisma/client'

/**
 * Get the current session user
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      avatar: true,
      bio: true,
      isBanned: true,
      isMuted: true,
      mutedUntil: true,
      createdAt: true,
    },
  })

  return user
}

/**
 * Check if user is authenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  if (user.isBanned) {
    throw new Error('Account is banned')
  }

  return user
}

/**
 * Role hierarchy: ADMIN > MODERATOR > CREATOR > USER
 */
const roleHierarchy: Record<UserRole, number> = {
  [UserRole.ADMIN]: 4,
  [UserRole.MODERATOR]: 3,
  [UserRole.CREATOR]: 2,
  [UserRole.USER]: 1,
}

/**
 * Check if user has required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole]
}

/**
 * Require user to have specific role or higher
 */
export async function requireRole(role: UserRole) {
  const user = await requireAuth()

  if (!hasRole(user.role as UserRole, role)) {
    throw new Error('Insufficient permissions')
  }

  return user
}

/**
 * Check if user is admin
 */
export async function requireAdmin() {
  return requireRole(UserRole.ADMIN)
}

/**
 * Check if user is moderator or higher
 */
export async function requireModerator() {
  return requireRole(UserRole.MODERATOR)
}

/**
 * Check if user is creator or higher
 */
export async function requireCreator() {
  return requireRole(UserRole.CREATOR)
}

/**
 * Check if user owns a resource (for IDOR prevention)
 */
export async function checkOwnership(
  userId: string,
  resourceOwnerId: string
): Promise<boolean> {
  if (userId === resourceOwnerId) {
    return true
  }

  // Admins can access any resource
  const user = await getCurrentUser()
  if (user?.role === UserRole.ADMIN) {
    return true
  }

  return false
}

/**
 * Require user to own a resource
 */
export async function requireOwnership(
  userId: string,
  resourceOwnerId: string
) {
  const owns = await checkOwnership(userId, resourceOwnerId)

  if (!owns) {
    throw new Error('You do not have permission to access this resource')
  }

  return true
}

/**
 * Check if user is muted
 */
export async function checkMuted(user: any): Promise<boolean> {
  if (!user.isMuted) {
    return false
  }

  if (user.mutedUntil && user.mutedUntil < new Date()) {
    // Mute has expired, unmuting
    await db.user.update({
      where: { id: user.id },
      data: {
        isMuted: false,
        mutedUntil: null,
      },
    })
    return false
  }

  return true
}

/**
 * Check if user can perform action based on mute status
 */
export async function requireNotMuted() {
  const user = await requireAuth()

  if (await checkMuted(user)) {
    const message = user.mutedUntil
      ? `You are muted until ${new Date(user.mutedUntil).toLocaleString()}`
      : 'You are muted'
    throw new Error(message)
  }

  return user
}

/**
 * Get user IP address from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp
  }

  return '0.0.0.0'
}

/**
 * Audit log helper
 */
export async function createAuditLog({
  userId,
  action,
  entityType,
  entityId,
  details,
  request,
}: {
  userId: string
  action: string
  entityType: string
  entityId?: string
  details?: string
  request?: Request
}) {
  await db.auditLog.create({
    data: {
      userId,
      action: action as any,
      entityType,
      entityId,
      details,
      ipAddress: request ? getClientIp(request) : null,
      userAgent: request?.headers.get('user-agent') || null,
    },
  })
}
