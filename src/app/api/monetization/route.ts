import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, requireAuth, createAuditLog } from '@/lib/auth-utils'
import { withRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import {
  SubscriptionTier,
  SubscriptionStatus,
  isSubscriptionActive,
  getSubscriptionTier,
} from '@/lib/monetization'

// POST /api/monetization/subscribe - Subscribe to a tier
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()

    // Rate limiting
    const rateLimitResult = withRateLimit(req, rateLimitConfigs.subscriptionPurchase, user.id)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { status: 429 }
      )
    }

    const { tier } = body

    if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    // Get subscription plan
    const plan = getSubscriptionTier(tier as SubscriptionTier)
    const price = plan.price

    // Simulate payment processing (in production, use Stripe/PayPal)
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // 1 month subscription

    // Create or update subscription
    const subscription = await db.subscription.upsert({
      where: {
        userId: user.id,
        status: SubscriptionStatus.ACTIVE,
      },
      create: {
        userId: user.id,
        tier: tier as SubscriptionTier,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate,
        amount: price,
        currency: plan.currency,
        autoRenew: true,
      },
      update: {
        tier: tier as SubscriptionTier,
        status: SubscriptionStatus.ACTIVE,
        endDate,
        amount: price,
        autoRenew: true,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      details: JSON.stringify({ tier, price, endDate }),
      request: req,
    })

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tier: tier as SubscriptionTier,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
        endDate,
        amount: price,
        currency: plan.currency,
      },
      plan: {
        ...plan,
        price: `$${price}`,
      },
      message: 'Successfully subscribed',
    })
  } catch (error: any) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// GET /api/monetization/subscription - Get user's subscription
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({
        subscription: null,
        currentTier: SubscriptionTier.FREE,
        isActive: false,
      })
    }

    const subscription = await db.subscription.findFirst({
      where: {
        userId: user.id,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING],
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        currentTier: SubscriptionTier.FREE,
        isActive: false,
      })
    }

    const tier = subscription.tier as SubscriptionTier
    const isActive = isSubscriptionActive(
      subscription.status as SubscriptionStatus,
      subscription.endDate
    )

    const plan = getSubscriptionTier(tier)

    return NextResponse.json({
      subscription: {
        id: subscription.id,
        tier,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        autoRenew: subscription.autoRenew,
        amount: subscription.amount,
        currency: subscription.currency,
      },
      plan: {
        ...plan,
        price: `$${subscription.amount}`,
      },
      currentTier: tier,
      isActive,
    })
  } catch (error: any) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/monetization/cancel - Cancel subscription
export async function POST_CANCEL(req: NextRequest) {
  try {
    const user = await requireAuth()

    const subscription = await db.subscription.findFirst({
      where: {
        userId: user.id,
        status: SubscriptionStatus.ACTIVE,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Cancel subscription
    const updatedSubscription = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        endDate: new Date(),
        autoRenew: false,
      },
    })

    // Create audit log
    await createAuditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: 'SUBSCRIPTION',
      entityId: subscription.id,
      details: JSON.stringify({ previousStatus: subscription.status }),
      request: req,
    })

    return NextResponse.json({
      message: 'Subscription cancelled successfully',
      subscription: updatedSubscription,
    })
  } catch (error: any) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
