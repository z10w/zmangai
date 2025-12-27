import { z } from 'zod'

// ============================================
// USER VALIDATION SCHEMAS
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

export const updateUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  avatar: z.string().url('Invalid avatar URL').optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
})

// ============================================
// READER PREFERENCES SCHEMA
// ============================================

export const readerPreferencesSchema = z.object({
  readingMode: z.enum(['VERTICAL', 'PAGED']),
  direction: z.enum(['LTR', 'RTL']),
  imageQuality: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color'),
  pageGap: z.number().int().min(0).max(50),
  hideUI: z.boolean(),
  autoScroll: z.boolean(),
})

// ============================================
// SERIES VALIDATION SCHEMAS
// ============================================

export const createSeriesSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be at most 200 characters'),
  alternativeTitles: z.string().optional(),
  description: z.string().max(2000, 'Description must be at most 2000 characters'),
  coverImage: z.string().url('Invalid cover image URL'),
  bannerImage: z.string().url('Invalid banner image URL').optional(),
  author: z.string().min(1, 'Author is required'),
  artist: z.string().optional(),
  type: z.enum(['MANGA', 'MANHWA', 'MANHUA']),
  status: z.enum(['ONGOING', 'COMPLETED', 'HIATUS', 'CANCELLED']),
  language: z.string().default('en'),
  isMature: z.boolean().default(false),
  genreIds: z.array(z.string()).min(1, 'At least one genre is required'),
  tagIds: z.array(z.string()).default([]),
})

export const updateSeriesSchema = createSeriesSchema.partial()

export const seriesQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  genre: z.string().optional(),
  type: z.enum(['MANGA', 'MANHWA', 'MANHUA']).optional(),
  status: z.enum(['ONGOING', 'COMPLETED', 'HIATUS', 'CANCELLED']).optional(),
  sort: z.enum(['popular', 'latest', 'rating', 'alphabetical']).default('latest'),
  search: z.string().optional(),
  mature: z.enum(['true', 'false', 'both']).default('both'),
})

// ============================================
// CHAPTER VALIDATION SCHEMAS
// ============================================

export const createChapterSchema = z.object({
  seriesId: z.string().min(1, 'Series ID is required'),
  chapterNumber: z.number().int().positive('Chapter number must be positive'),
  title: z.string().min(1, 'Title is required').max(200),
  volume: z.number().int().min(0).default(0),
  isPublished: z.boolean().default(true),
  scheduledFor: z.string().datetime().optional(),
})

export const updateChapterSchema = createChapterSchema.partial()

export const chapterQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
})

// ============================================
// PAGE VALIDATION SCHEMAS
// ============================================

export const createPageSchema = z.object({
  chapterId: z.string().min(1, 'Chapter ID is required'),
  imageUrl: z.string().url('Invalid image URL'),
  order: z.number().int().positive('Order must be positive'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
})

// ============================================
// COMMENT VALIDATION SCHEMAS
// ============================================

export const createCommentSchema = z.object({
  chapterId: z.string().min(1, 'Chapter ID is required'),
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be at most 2000 characters'),
  hasSpoiler: z.boolean().default(false),
  parentId: z.string().optional(),
})

export const updateCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be at most 2000 characters')
    .optional(),
  hasSpoiler: z.boolean().optional(),
})

export const commentQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
})

// ============================================
// RATING VALIDATION SCHEMAS
// ============================================

export const createRatingSchema = z.object({
  seriesId: z.string().min(1, 'Series ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
})

export const updateRatingSchema = createRatingSchema

// ============================================
// REVIEW VALIDATION SCHEMAS
// ============================================

export const createReviewSchema = z.object({
  seriesId: z.string().min(1, 'Series ID is required'),
  content: z.string()
    .min(1, 'Review cannot be empty')
    .max(5000, 'Review must be at most 5000 characters'),
  hasSpoiler: z.boolean().default(false),
})

export const updateReviewSchema = createReviewSchema.partial()

// ============================================
// FOLLOW VALIDATION SCHEMAS
// ============================================

export const followSchema = z.object({
  seriesId: z.string().min(1, 'Series ID is required'),
})

// ============================================
// READING PROGRESS SCHEMAS
// ============================================

export const updateProgressSchema = z.object({
  chapterId: z.string().min(1, 'Chapter ID is required'),
  pageIndex: z.number().int().min(0).optional(),
  scrollOffset: z.number().min(0).max(1).optional(),
  isCompleted: z.boolean().optional(),
})

// ============================================
// NOTIFICATION SCHEMAS
// ============================================

export const notificationQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  unreadOnly: z.enum(['true', 'false']).optional(),
})

export const markNotificationReadSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  markAll: z.boolean().optional(),
})

// ============================================
// REPORT SCHEMAS
// ============================================

export const createReportSchema = z.object({
  type: z.enum(['COMMENT', 'SERIES', 'CHAPTER', 'USER']),
  entityId: z.string().min(1, 'Entity ID is required'),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason must be at most 200 characters'),
  description: z.string().max(1000, 'Description must be at most 1000 characters').optional(),
})

export const updateReportSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']),
  notes: z.string().max(1000).optional(),
})

// ============================================
// GENRE & TAG SCHEMAS
// ============================================

export const createGenreSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  description: z.string().max(500).optional(),
})

export const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
})

// ============================================
// USER MANAGEMENT SCHEMAS (ADMIN/MODERATOR)
// ============================================

export const banUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().min(1, 'Reason is required').max(500),
})

export const muteUserSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  duration: z.number().int().positive('Duration must be positive (in hours)').optional(),
  reason: z.string().min(1, 'Reason is required').max(500),
})

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['USER', 'CREATOR', 'MODERATOR', 'ADMIN']),
})

export const deleteCommentSchema = z.object({
  commentId: z.string().min(1, 'Comment ID is required'),
  reason: z.string().max(500).optional(),
})

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse and validate request body
 */
export async function parseRequestBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: any }> {
  try {
    const body = await req.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return { success: false, error: 'Invalid JSON' }
  }
}

/**
 * Parse and validate query parameters
 */
export function parseQueryParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: any } {
  try {
    const params: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      params[key] = value
    })

    const result = schema.safeParse(params)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return { success: false, error: 'Invalid query parameters' }
  }
}
