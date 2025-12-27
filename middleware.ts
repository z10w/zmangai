import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const isAdmin = token?.role === 'ADMIN'
    const isCreator = token?.role === 'CREATOR' || token?.role === 'ADMIN'
    const isModerator = token?.role === 'MODERATOR' || token?.role === 'ADMIN'

    const { pathname } = req.nextUrl

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Creator dashboard protection
    if (pathname.startsWith('/creator')) {
      if (!isCreator) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    // Moderator routes protection
    if (pathname.startsWith('/moderator')) {
      if (!isModerator) {
        return NextResponse.redirect(new URL('/unauthorized', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes - no auth required
        const publicRoutes = [
          '/',
          '/login',
          '/register',
          '/discover',
          '/series',
          '/api/series',
          '/api/genres',
          '/api/tags',
          '/unauthorized',
        ]

        if (publicRoutes.some((route) => pathname.startsWith(route))) {
          return true
        }

        // Protected routes - require auth
        if (pathname.startsWith('/library') ||
            pathname.startsWith('/profile') ||
            pathname.startsWith('/reader') ||
            pathname.startsWith('/api/follows') ||
            pathname.startsWith('/api/comments') ||
            pathname.startsWith('/api/ratings') ||
            pathname.startsWith('/api/progress')) {
          return !!token
        }

        return true
      },
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth.js already handles these)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
