/**
 * In-memory rate limiter
 * Note: For production, consider using Redis or similar distributed cache
 */

interface RateLimitStore {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitStore>()

// Cleanup old entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key)
    }
  }
}, 60000)

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

/**
 * Check if a request should be rate limited
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
} {
  const now = Date.now()
  const entry = store.get(identifier)

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired
    const resetTime = now + config.windowMs
    store.set(identifier, {
      count: 1,
      resetTime,
    })

    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  // Increment counter
  entry.count++

  if (entry.count > config.maxRequests) {
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
    }
  }

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Rate limiting configurations for different endpoints
 */
export const rateLimitConfigs = {
  // Authentication - strict
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  register: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 requests per hour

  // Comments - moderate
  comment: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  like: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests per minute

  // Content creation - moderate
  createSeries: { maxRequests: 2, windowMs: 60 * 60 * 1000 }, // 2 series per hour
  createChapter: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 chapters per hour

  // General API - lenient
  general: { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes

  // File uploads - very strict
  upload: { maxRequests: 5, windowMs: 60 * 60 * 1000 }, // 5 uploads per hour
}

/**
 * Get client IP from request
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

  return 'unknown'
}

/**
 * Get rate limit identifier (user ID or IP)
 */
export function getRateLimitIdentifier(request: Request, userId?: string): string {
  if (userId) {
    return `user:${userId}`
  }

  const ip = getClientIp(request)
  return `ip:${ip}`
}

/**
 * Apply rate limiting to an API route
 */
export function withRateLimit(
  request: Request,
  config: RateLimitConfig,
  userId?: string
): { success: false; error: string; resetTime: number } | { success: true } {
  const identifier = getRateLimitIdentifier(request, userId)
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    return {
      success: false,
      error: `Rate limit exceeded. Try again after ${new Date(result.resetTime).toLocaleString()}`,
      resetTime: result.resetTime,
    }
  }

  return { success: true }
}
