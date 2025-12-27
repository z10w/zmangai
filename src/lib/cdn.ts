// CDN Configuration

export const CDN_CONFIG = {
  enabled: process.env.CDN_ENABLED === 'true',

  // Cloudflare R2 / S3 compatible CDN
  endpoint: process.env.CDN_ENDPOINT || 'https://cdn.mangaverse.com',
  accessKeyId: process.env.CDN_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.CDN_SECRET_ACCESS_KEY || '',
  bucket: process.env.CDN_BUCKET || 'mangaverse',
  region: process.env.CDN_REGION || 'auto',

  // CDN paths
  paths: {
    covers: 'covers',
    banners: 'banners',
    pages: 'pages',
    avatars: 'avatars',
  },

  // URL settings
  url: {
    // Base URL for serving files
    publicUrl: process.env.NEXT_PUBLIC_CDN_URL || process.env.CDN_ENDPOINT || 'https://cdn.mangaverse.com',

    // Custom domain (optional)
    customDomain: process.env.CDN_CUSTOM_DOMAIN || '', // e.g., 'cdn.mangaverse.com'
  },

  // Image optimization
  images: {
    // Enable automatic image optimization via CDN
    optimize: process.env.CDN_IMAGE_OPTIMIZE === 'true',

    // Default quality for CDN image transformations
    quality: '85', // 85% quality

    // Default format
    format: 'webp', // Use WebP when supported

    // Supported formats for transformation
    formats: ['webp', 'avif', 'jpg', 'png'],
  },

  // Cache control
  cache: {
    // Default cache duration for images
    maxAge: '31536000', // 1 year in seconds

    // Cache bypass header for updates
    bypassKey: process.env.CDN_CACHE_BYPASS_KEY || 'mangaverse-bypass',
  },
}

// Generate public URL for a file
export function getPublicUrl(path: string): string {
  if (CDN_CONFIG.enabled) {
    const baseUrl = CDN_CONFIG.url.customDomain || CDN_CONFIG.url.publicUrl
    return `${baseUrl}/${path}`
  }

  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/${path}`
}

// Get CDN endpoint for uploads
export function getCdnEndpoint(): string {
  if (CDN_CONFIG.enabled) {
    return CDN_CONFIG.endpoint
  }

  return null
}

// Check if CDN is available
export function isCdnEnabled(): boolean {
  return CDN_CONFIG.enabled
}

// Get CDN upload credentials (server-side only)
export function getCdnCredentials() {
  if (!isCdnEnabled()) {
    return null
  }

  return {
    endpoint: CDN_CONFIG.endpoint,
    accessKeyId: CDN_CONFIG.accessKeyId,
    secretAccessKey: CDN_CONFIG.secretAccessKey,
    bucket: CDN_CONFIG.bucket,
    region: CDN_CONFIG.region,
  }
}

// Types for CDN operations
export interface CdnUploadResult {
  success: boolean
  url: string
  key: string
  error?: string
}

export interface CdnUploadOptions {
  path: string
  file: File | Buffer
  contentType?: string
  metadata?: Record<string, string>
  isPublic?: boolean
}

// Upload file to CDN
export async function uploadToCdn(options: CdnUploadOptions): Promise<CdnUploadResult> {
  if (!isCdnEnabled()) {
    return {
      success: false,
      url: '',
      key: '',
      error: 'CDN is not enabled',
    }
  }

  try {
    // In a real implementation, this would use AWS SDK or similar
    // For now, simulate upload to CDN
    const key = `${options.path}/${Date.now()}-${Math.random().toString(36).substring(7)}`
    const url = getPublicUrl(key)

    return {
      success: true,
      url,
      key,
    }
  } catch (error: any) {
    return {
      success: false,
      url: '',
      key: '',
      error: error.message || 'CDN upload failed',
    }
  }
}

// Delete file from CDN
export async function deleteFromCdn(key: string): Promise<boolean> {
  if (!isCdnEnabled()) {
    return false
  }

  try {
    // In a real implementation, this would delete from CDN
    console.log(`Deleting from CDN: ${key}`)
    return true
  } catch (error) {
    console.error('CDN delete error:', error)
    return false
  }
}

// Generate signed URL for private files
export function generateSignedUrl(key: string, expiresIn: number = 3600): string {
  if (!isCdnEnabled()) {
    return getPublicUrl(key)
  }

  // In a real implementation, this would generate a signed URL
  // For Cloudflare R2: using HMAC-SHA256
  const expires = new Date(Date.now() + expiresIn * 1000).toISOString()
  return `${getPublicUrl(key)}?expires=${expires}`
}

// Transformations
export function getImageTransformationUrl(
  key: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'avif' | 'jpg' | 'png'
    fit?: 'cover' | 'contain' | 'fill'
  } = {}
): string {
  if (!isCdnEnabled()) {
    return getPublicUrl(key)
  }

  const baseUrl = getPublicUrl(key)
  const params: string[] = []

  if (options.width) params.push(`w=${options.width}`)
  if (options.height) params.push(`h=${options.height}`)
  if (options.quality) params.push(`q=${options.quality}`)
  if (options.format) params.push(`f=${options.format}`)
  if (options.fit) params.push(`fit=${options.fit}`)

  return params.length > 0 ? `${baseUrl}?${params.join('&')}` : baseUrl
}
