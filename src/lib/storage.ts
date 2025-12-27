import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync, unlink } from 'node:fs'
import { sharp } from 'sharp'
import { isCdnEnabled, uploadToCdn, deleteFromCdn, getPublicUrl, getCdnEndpoint, getImageTransformationUrl, CdnUploadOptions } from './cdn'

/**
 * Storage types
 */
export type StorageType = 'local' | 'cdn'

/**
 * Upload result
 */
export interface UploadResult {
  url: string
  path: string
  width?: number
  height?: number
  size?: number
}

/**
 * Storage configuration
 */
const STORAGE_TYPE = (process.env.STORAGE_TYPE as StorageType) || 'local'
const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'

/**
 * Get safe filename (sanitize and prevent path traversal)
 */
export function getSafeFilename(filename: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 15)

  // Remove extension
  const lastDotIndex = filename.lastIndexOf('.')
  const name = lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename
  const ext = lastDotIndex > 0 ? filename.substring(lastDotIndex) : ''

  // Sanitize name
  const sanitizedName = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  return `${sanitizedName}-${timestamp}-${random}${ext}`
}

/**
 * Validate image file
 */
export async function validateImageFile(
  file: File
): Promise<{ valid: boolean; info: any }> {
  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 10MB limit' }
  }

  // Check MIME type
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed' }
  }

  try {
    const buffer = await file.arrayBuffer()
    const info = await sharp(Buffer.from(buffer)).metadata()

    // Check image dimensions (max 8000x8000)
    if (info.width && info.width > 8000) {
      return { valid: false, error: 'Image width exceeds 8000px limit' }
    }

    if (info.height && info.height > 8000) {
      return { valid: false, error: 'Image height exceeds 8000px limit' }
    }

    return { valid: true, info }
  } catch (error) {
    return { valid: false, error: 'Invalid image file' }
  }
}

/**
 * Process and optimize image
 */
export async function processImage(
  file: File,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
): Promise<{ buffer: Buffer; info: any }> {
  const { maxWidth, maxHeight, quality = 85, format = 'webp' } = options

  const buffer = await file.arrayBuffer()
  let image = sharp(Buffer.from(buffer))

  // Resize if dimensions specified
  if (maxWidth || maxHeight) {
    image = image.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  // Convert and optimize
  image = image.toFormat(format, {
    quality,
    progressive: format === 'jpeg',
  })

  const processedBuffer = await image.toBuffer()
  const info = await sharp(processedBuffer).metadata()

  return { buffer: processedBuffer, info }
}

/**
 * Save image to local storage
 */
async function saveToLocal(
  file: File,
  subfolder: string,
  filename: string,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
  } = {}
): Promise<UploadResult> {
  const { buffer, info } = await processImage(file, options)

  // Create directory if it doesn't exist
  const dir = join(process.cwd(), UPLOAD_DIR, subfolder)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }

  // Save file
  const filepath = join(dir, filename)
  await writeFile(filepath, Buffer.from(buffer))

  // Get file extension from format
  const ext = options.format || 'webp'
  const urlName = filename.replace(/\.[^/.]+$/, `.${ext}`)

  return {
    url: `/uploads/${subfolder}/${urlName}`,
    path: filepath,
    width: info.width,
    height: info.height,
    size: buffer.length,
  }
}

/**
 * Upload image (abstracted storage layer)
 */
export async function uploadImage(
  file: File,
  subfolder: string,
  options: {
    maxWidth?: number
    maxHeight?: number
    quality?: number
    format?: 'jpeg' | 'png' | 'webp'
    filename?: string
    isPublic?: boolean
  } = {}
): Promise<UploadResult> {
  // Validate image
  const validation = await validateImageFile(file)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const filename = options.filename || getSafeFilename(file.name)

  // Route to appropriate storage
  if (isCdnEnabled()) {
    // Upload to CDN
    const result = await uploadToCdn({
      path: `${subfolder}/${filename}`,
      file,
      contentType: file.type,
      isPublic: options.isPublic !== false,
    })

    if (!result.success) {
      throw new Error(result.error || 'CDN upload failed')
    }

    return {
      url: result.url,
      path: result.url,
    }
  } else {
    // Save to local storage
    return saveToLocal(file, subfolder, filename, options)
  }
}

/**
 * Upload series cover image
 */
export async function uploadSeriesCover(
  file: File,
  seriesSlug: string
): Promise<UploadResult> {
  return uploadImage(file, 'series/covers', {
    maxWidth: 600,
    maxHeight: 800,
    quality: 90,
    format: 'webp',
    filename: `${seriesSlug}-cover.webp`,
    isPublic: true,
  })
}

/**
 * Upload series banner image
 */
export async function uploadSeriesBanner(
  file: File,
  seriesSlug: string
): Promise<UploadResult> {
  return uploadImage(file, 'series/banners', {
    maxWidth: 1920,
    maxHeight: 600,
    quality: 85,
    format: 'webp',
    filename: `${seriesSlug}-banner.webp`,
    isPublic: true,
  })
}

/**
 * Upload chapter page
 */
export async function uploadChapterPage(
  file: File,
  seriesSlug: string,
  chapterId: string,
  pageNumber: number
): Promise<UploadResult> {
  const subfolder = `chapters/${seriesSlug}/${chapterId}`
  return uploadImage(file, subfolder, {
    maxWidth: 1600,
    maxHeight: 2400,
    quality: 85,
    format: 'webp',
    filename: `${pageNumber.toString().padStart(3, '0')}.webp`,
    isPublic: true,
  })
}

/**
 * Upload multiple pages (batch)
 */
export async function uploadChapterPages(
  files: File[],
  seriesSlug: string,
  chapterId: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file, index) =>
    uploadChapterPage(file, seriesSlug, chapterId, index + 1)
  )

  return Promise.all(uploadPromises)
}

/**
 * Upload user avatar
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  return uploadImage(file, 'avatars', {
    maxWidth: 400,
    maxHeight: 400,
    quality: 90,
    format: 'webp',
    filename: `${userId}-avatar.webp`,
    isPublic: true,
  })
}

/**
 * Delete image from storage
 */
export async function deleteImage(path: string): Promise<boolean> {
  if (isCdnEnabled()) {
    // Delete from CDN
    return deleteFromCdn(path)
  } else {
    // Delete from local storage
    const fullPath = join(process.cwd(), UPLOAD_DIR, path)
    try {
      await unlink(fullPath)
      return true
    } catch (error) {
      console.error('Failed to delete image:', error)
      return false
    }
  }
}

/**
 * Get public URL for a file
 */
export function getPublicUrl(path: string): string {
  if (isCdnEnabled()) {
    return getPublicUrl(path)
  }

  // Local storage
  return `/uploads/${path}`
}

/**
 * Get CDN endpoint for uploads
 */
export function getCdnUploadEndpoint(): string | null {
  return getCdnEndpoint()
}

/**
 * Check if CDN is enabled
 */
export function isStorageCdn(): boolean {
  return isCdnEnabled()
}

/**
 * Get image transformation URL (for responsive images)
 */
export function getImageUrl(
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpg' | 'png'
  } = {}
): string {
  if (isStorageCdn()) {
    return getImageTransformationUrl(path, options)
  }

  // Local storage - return original URL (no transformations)
  return getPublicUrl(path)
}
