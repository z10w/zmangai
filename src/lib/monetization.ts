// Monetization types and constants

export enum SubscriptionTier {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  PENDING = 'PENDING',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum CoinTransactionType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  REFUNDED = 'REFUNDED',
  GRANTED = 'GRANTED', // Admin granted
  ADMIN_ADJUSTED = 'ADMIN_ADJUSTED', // Admin adjustment
}

// Subscription features per tier
export const SUBSCRIPTION_FEATURES = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    description: 'Basic access to free content',
    price: 0,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Read free chapters',
      'Follow up to 50 series',
      'Post up to 10 comments per day',
      'Basic reader mode (vertical)',
      'Standard image quality',
      'Ads included',
    ],
    limits: {
      follows: 50,
      commentsPerDay: 10,
      imageQuality: 'standard',
      readerMode: ['vertical'],
    },
  },

  [SubscriptionTier.BASIC]: {
    name: 'Basic',
    description: 'Enhanced reading experience',
    price: 4.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Everything in Free',
      'Ad-free reading',
      'Improved reader mode (paged)',
      'Higher image quality',
      'Follow up to 100 series',
      'Post unlimited comments',
      'Reading progress tracking',
      'Custom reader settings',
    ],
    limits: {
      follows: 100,
      commentsPerDay: 'unlimited',
      imageQuality: 'high',
      readerMode: ['vertical', 'paged'],
    },
  },

  [SubscriptionTier.PREMIUM]: {
    name: 'Premium',
    description: 'Ultimate reading experience',
    price: 9.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Everything in Basic',
      'Early access to chapters (24 hours)',
      'Exclusive content',
      'Priority support',
      'Bookmark unlimited chapters',
      'Custom reader themes',
      'Download chapters for offline reading',
    ],
    limits: {
      follows: 'unlimited',
      commentsPerDay: 'unlimited',
      imageQuality: 'ultra',
      readerMode: ['vertical', 'paged'],
      earlyAccessHours: 24,
    },
  },

  [SubscriptionTier.VIP]: {
    name: 'VIP',
    description: 'Exclusive creator perks',
    price: 19.99,
    currency: 'USD',
    billingCycle: 'monthly',
    features: [
      'Everything in Premium',
      'Early access to chapters (48 hours)',
      'Exclusive VIP chapters',
      'Creator dashboard features',
      'Analytics dashboard',
      'No watermarks on downloads',
      'Priority customer support',
      'Monthly coin bonus (500 coins)',
      'Creator commission boost (20% more)',
    ],
    limits: {
      follows: 'unlimited',
      commentsPerDay: 'unlimited',
      imageQuality: 'ultra',
      readerMode: ['vertical', 'paged'],
      earlyAccessHours: 48,
      monthlyCoinBonus: 500,
    },
  },
} as const

// Early access settings
export const EARLY_ACCESS_CONFIG = {
  enabled: true,
  defaultHours: {
    [SubscriptionTier.BASIC]: 0,
    [SubscriptionTier.PREMIUM]: 24,
    [SubscriptionTier.VIP]: 48,
  },
  chapterUnlockCost: {
    free: 0,
    basic: 100, // 100 coins
    premium: 50, // 50 coins
    vip: 0, // Included in VIP
  },
}

// Coin system configuration
export const COIN_CONFIG = {
  enabled: true,
  name: 'MangaVerse Coins',
  symbol: '🪙',
  startingAmount: 0,

  // Earning rates
  earningRates: {
    dailyLogin: 10, // 10 coins for daily login
    readingChapter: 5, // 5 coins per chapter read
    comment: 2, // 2 coins per comment
    review: 10, // 10 coins per review
    rating: 5, // 5 coins per rating
    share: 5, // 5 coins per share
  },

  // Spending costs
  costs: {
    unlockChapter: EARLY_ACCESS_CONFIG.chapterUnlockCost,
    downloadChapter: 50, // 50 coins to download
    bookmarkChapter: 10, // 10 coins per bookmark
    removeAds: 50, // 50 coins for ad-free day (temporary)
    customTheme: 100, // 100 coins to unlock custom theme
  },

  // Purchase options
  purchaseOptions: [
    { coins: 100, price: 0.99, currency: 'USD' },
    { coins: 500, price: 4.99, currency: 'USD' },
    { coins: 1000, price: 9.99, currency: 'USD' },
    { coins: 5000, price: 39.99, currency: 'USD' },
  ],
}

// Types for monetization
export interface SubscriptionPlan {
  tier: SubscriptionTier
  name: string
  description: string
  price: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  features: string[]
  limits: any
}

export interface UserSubscription {
  id: string
  userId: string
  tier: SubscriptionTier
  status: SubscriptionStatus
  startDate: Date
  endDate?: Date
  autoRenew: boolean
  amount: number
  currency: string
  stripeSubscriptionId?: string
  stripeCustomerId?: string
}

export interface CoinBalance {
  userId: string
  balance: number
  lastUpdated: Date
}

export interface CoinTransaction {
  id: string
  userId: string
  type: CoinTransactionType
  amount: number
  description: string
  metadata?: Record<string, any>
  createdAt: Date
}

export interface EarlyAccessUnlock {
  id: string
  userId: string
  chapterId: string
  unlockedAt: Date
  coinsSpent: number
}

export interface Download {
  id: string
  userId: string
  chapterId: string
  downloadedAt: Date
  coinsSpent?: number
  expiresAt: Date
}

// Helper functions
export function getSubscriptionTier(tier: SubscriptionTier): SubscriptionPlan {
  return SUBSCRIPTION_FEATURES[tier]
}

export function getSubscriptionPrice(tier: SubscriptionTier, yearly: boolean = false): number {
  const plan = SUBSCRIPTION_FEATURES[tier]
  return yearly ? plan.price * 10 : plan.price // Yearly is 10x monthly (12 months minus discount)
}

export function getSubscriptionFeatures(tier: SubscriptionTier): string[] {
  return SUBSCRIPTION_FEATURES[tier].features
}

export function canUnlockEarlyAccess(tier: SubscriptionTier, hours: number): boolean {
  return SUBSCRIPTION_FEATURES[tier].limits.earlyAccessHours >= hours
}

export function isSubscriptionActive(status: SubscriptionStatus, endDate?: Date): boolean {
  if (status !== SubscriptionStatus.ACTIVE) {
    return false
  }

  if (endDate && new Date() > endDate) {
    return false
  }

  return true
}

export function hasAdFreeAccess(tier: SubscriptionTier): boolean {
  return tier === SubscriptionTier.BASIC ||
         tier === SubscriptionTier.PREMIUM ||
         tier === SubscriptionTier.VIP
}

export function hasCustomThemeAccess(tier: SubscriptionTier): boolean {
  return tier === SubscriptionTier.PREMIUM ||
         tier === SubscriptionTier.VIP
}

export function getCoinPurchasePrice(coins: number): number {
  const option = COIN_CONFIG.purchaseOptions.find((opt) => opt.coins === coins)
  return option?.price || (coins / 100) * 0.99 // Fallback: $0.99 per 100 coins
}
