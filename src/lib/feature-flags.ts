// Feature flags system for controlling functionality
// Supports environment variables and dynamic toggling for A/B testing

export const FEATURE_FLAGS = {
  // Platform features
  PWA: {
    enabled: process.env.FEATURE_PWA === 'true',
    description: 'Progressive Web App support',
    rollout: '100%', // Percentage of users with this feature
  },
  MONETIZATION: {
    enabled: process.env.FEATURE_MONETIZATION === 'true',
    description: 'Monetization features (subscriptions, coins, early access)',
    rollout: '0%', // Not rolled out yet
  },
  ANALYTICS: {
    enabled: process.env.FEATURE_ANALYTICS === 'true',
    description: 'Advanced analytics and statistics',
    rollout: '100%',
  },

  // Content features
  COMMENTS: {
    enabled: true,
    description: 'Comments system',
    rollout: '100%',
  },
  REVIEWS: {
    enabled: true,
    description: 'Reviews and ratings system',
    rollout: '100%',
  },
  SOCIAL: {
    enabled: true,
    description: 'Social features (follows, likes, shares)',
    rollout: '100%',
  },

  // Reader features
  READER_VERTICAL_SCROLL: {
    enabled: true,
    description: 'Vertical scroll reading mode',
    rollout: '100%',
  },
  READER_PAGED: {
    enabled: true,
    description: 'Paged reading mode',
    rollout: '100%',
  },
  READER_KEYBOARD_SHORTCUTS: {
    enabled: true,
    description: 'Keyboard shortcuts in reader',
    rollout: '100%',
  },
  READER_AUTO_SCROLL: {
    enabled: true,
    description: 'Auto-scroll feature in reader',
    rollout: '100%',
  },
  READER_CUSTOMIZATION: {
    enabled: true,
    description: 'Reader customization (background, gap, etc.)',
    rollout: '100%',
  },
  READER_PROGRESS_TRACKING: {
    enabled: true,
    description: 'Reading progress tracking and auto-save',
    rollout: '100%',
  },

  // Creator features
  CREATOR_SERIES: {
    enabled: true,
    description: 'Series management for creators',
    rollout: '100%',
  },
  CREATOR_CHAPTERS: {
    enabled: true,
    description: 'Chapter management for creators',
    rollout: '100%',
  },
  CREATOR_BATCH_UPLOAD: {
    enabled: true,
    description: 'Batch upload for chapters',
    rollout: '100%',
  },
  CREATOR_ANALYTICS: {
    enabled: process.env.FEATURE_ANALYTICS === 'true',
    description: 'Analytics dashboard for creators',
    rollout: '100%',
  },

  // Admin features
  ADMIN_DASHBOARD: {
    enabled: true,
    description: 'Admin dashboard',
    rollout: '100%',
  },
  ADMIN_USER_MANAGEMENT: {
    enabled: true,
    description: 'User management for admins',
    rollout: '100%',
  },
  ADMIN_MODERATION: {
    enabled: true,
    description: 'Content moderation tools',
    rollout: '100%',
  },
  ADMIN_ANALYTICS: {
    enabled: process.env.FEATURE_ANALYTICS === 'true',
    description: 'Platform analytics for admins',
    rollout: '100%',
  },

  // Storage features
  STORAGE_LOCAL: {
    enabled: true,
    description: 'Local file storage',
    rollout: '100%',
  },
  STORAGE_CDN: {
    enabled: process.env.CDN_ENABLED === 'true',
    description: 'CDN file storage (S3/Cloudflare R2)',
    rollout: '100%',
  },
  STORAGE_CDN_OPTIMIZATION: {
    enabled: process.env.CDN_IMAGE_OPTIMIZE === 'true',
    description: 'CDN image optimization',
    rollout: '100%',
  },

  // Performance features
  CACHE_SERIES: {
    enabled: process.env.CACHE_SERIES === 'true',
    description: 'Series data caching',
    rollout: '100%',
  },
  CACHE_CHAPTERS: {
    enabled: process.env.CACHE_CHAPTERS === 'true',
    description: 'Chapter data caching',
    rollout: '100%',
  },
  CACHE_USERS: {
    enabled: true,
    description: 'User data caching',
    rollout: '100%',
  },

  // SEO features
  SEO_METADATA: {
    enabled: true,
    description: 'SEO metadata and OpenGraph tags',
    rollout: '100%',
  },
  SEO_SITEMAP: {
    enabled: true,
    description: 'XML sitemap generation',
    rollout: '100%',
  },
  SEO_SCHEMA_ORG: {
    enabled: true,
    description: 'Schema.org structured data',
    rollout: '100%',
  },
} as const

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureKey: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[featureKey].enabled
}

/**
 * Check if a feature is rolled out for a specific user
 * Uses percentage-based rollout for gradual feature deployment
 */
export function isFeatureRolledOut(
  featureKey: keyof typeof FEATURE_FLAGS,
  userId?: string
): boolean {
  const feature = FEATURE_FLAGS[featureKey]

  // Feature must be enabled
  if (!feature.enabled) {
    return false
  }

  // If rollout is 100%, feature is available to all
  if (feature.rollout === '100%') {
    return true
  }

  // For gradual rollouts, use consistent hashing based on userId
  if (!userId) {
    return false
  }

  // Simple hash: convert first characters of userId to number
  const hash = userId
    .split('')
    .slice(0, 8)
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)

  // Parse rollout percentage (remove % sign)
  const rolloutPercentage = parseInt(feature.rollout.replace('%', '')) || 0

  // Feature is rolled out if user hash is within rollout percentage
  const maxHash = Math.floor((rolloutPercentage / 100) * Number.MAX_SAFE_INTEGER)
  return hash <= maxHash
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, feature]) => feature.enabled)
    .map(([key, _]) => key)
}

/**
 * Get disabled features
 */
export function getDisabledFeatures(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, feature]) => !feature.enabled)
    .map(([key, _]) => key)
}

/**
 * Get feature metadata
 */
export function getFeatureInfo(featureKey: keyof typeof FEATURE_FLAGS) {
  return FEATURE_FLAGS[featureKey]
}

/**
 * Feature flags for A/B testing
 * Group features into variants for testing
 */
export const AB_TEST_VARIANTS = {
  // Reader interface testing
  READER_LAYOUT: {
    variant_a: 'Classic vertical scroll',
    variant_b: 'Modern horizontal scroll',
    variant_c: 'Hybrid with controls',
  },

  // Homepage testing
  HOMEPAGE_LAYOUT: {
    variant_a: 'Grid layout',
    variant_b: 'List layout',
  },

  // Series detail page testing
  SERIES_DETAIL_LAYOUT: {
    variant_a: 'Compact layout',
    variant_b: 'Full-featured layout',
  },

  // Reader mode testing
  READER_MODE: {
    variant_a: 'Default reader',
    variant_b: 'Immersive reader',
  },
} as const

/**
 * Get A/B test variant for a feature
 * Uses user ID to consistently assign the same variant
 */
export function getABTestVariant(
  testKey: keyof typeof AB_TEST_VARIANTS,
  userId?: string
): string | null {
  const testVariants = AB_TEST_VARIANTS[testKey]

  if (!userId || !testVariants) {
    return null
  }

  const variants = Object.entries(testVariants)
  const variantKeys = Object.keys(testVariants)

  // Use hash of userId to select variant
  const hash = userId
    .split('')
    .slice(0, 8)
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const variantIndex = hash % variantKeys.length
  const [selectedVariant] = Object.entries(testVariants)[variantIndex]

  return selectedVariant
}

/**
 * Check if user is in test group for a feature
 */
export function isInTestGroup(
  testKey: keyof typeof AB_TEST_VARIANTS,
  userId?: string,
  expectedVariant?: string
): boolean {
  const variant = getABTestVariant(testKey, userId)

  if (!variant || !expectedVariant) {
    return false
  }

  return variant === expectedVariant
}

/**
 * Feature flags for early access (monetization)
 */
export const EARLY_ACCESS_FLAGS = {
  FREE_TIER: {
    enabled: true,
    description: 'Free tier access (basic chapters)',
  },
  PAID_TIER: {
    enabled: process.env.FEATURE_MONETIZATION === 'true',
    description: 'Paid tier access (early chapters, premium content)',
    rollout: '0%',
  },
  VIP_TIER: {
    enabled: false,
    description: 'VIP tier access (exclusive content, perks)',
    rollout: '0%',
  },
} as const

/**
 * Get user's access tier
 */
export function getUserAccessTier(userId?: string): 'FREE' | 'PAID' | 'VIP' {
  // VIP tier check
  if (EARLY_ACCESS_FLAGS.VIP_TIER.enabled && isFeatureRolledOut('VIP_TIER', userId)) {
    return 'VIP'
  }

  // Paid tier check
  if (EARLY_ACCESS_FLAGS.PAID_TIER.enabled && isFeatureRolledOut('PAID_TIER', userId)) {
    return 'PAID'
  }

  // Default to free tier
  return 'FREE'
}

/**
 * Check if user has access to monetized content
 */
export function hasMonetizationAccess(userId?: string): boolean {
  const accessTier = getUserAccessTier(userId)

  // Free tier has access to free content only
  if (accessTier === 'FREE') {
    return false
  }

  // Paid and VIP tiers have access to all content
  return true
}

/**
 * Feature flags for content filtering
 */
export const CONTENT_FILTERING_FLAGS = {
  MATURE_CONTENT: {
    enabled: true,
    description: 'Mature content visibility',
    rollout: '100%',
  },
  SPOLILER_PROTECTION: {
    enabled: true,
    description: 'Spoiler protection in reviews and comments',
    rollout: '100%',
  },
} as const

/**
 * Get content filtering settings for a user
 */
export function getContentFilterSettings(userId?: string) {
  return {
    showMature: CONTENT_FILTERING_FLAGS.MATURE_CONTENT.enabled,
    protectSpoilers: CONTENT_FILTERING_FLAGS.SPOILER_PROTECTION.enabled,
  }
}

/**
 * Feature flags for performance monitoring
 */
export const MONITORING_FLAGS = {
  PERFORMANCE_TRACKING: {
    enabled: true,
    description: 'Performance tracking and metrics',
    rollout: '100%',
  },
  ERROR_TRACKING: {
    enabled: true,
    description: 'Error tracking and logging',
    rollout: '100%',
  },
  ANALYTICS_TRACKING: {
    enabled: process.env.FEATURE_ANALYTICS === 'true',
    description: 'Analytics tracking',
    rollout: '100%',
  },
} as const

/**
 * Get monitoring settings
 */
export function getMonitoringSettings(userId?: string) {
  return {
    trackPerformance: MONITORING_FLAGS.PERFORMANCE_TRACKING.enabled,
    trackErrors: MONITORING_FLAGS.ERROR_TRACKING.enabled,
    trackAnalytics: MONITORING_FLAGS.ANALYTICS_TRACKING.enabled,
  }
}

export type FeatureKey = keyof typeof FEATURE_FLAGS
export type ABTestKey = keyof typeof AB_TEST_VARIANTS
export type EarlyAccessTier = 'FREE' | 'PAID' | 'VIP'
