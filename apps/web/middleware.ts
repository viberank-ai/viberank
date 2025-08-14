/**
 * Next.js Middleware - Request interceptor for auth and routing
 *
 * This middleware runs before every request to check authentication.
 * Currently simplified for development - in production would integrate
 * with Clerk for proper authentication.
 *
 * Current behavior:
 * - USE_MOCK_AUTH=1: Bypasses all auth (development/testing)
 * - Otherwise: Allows all requests (Clerk integration disabled)
 *
 * Production requirements:
 * - Import and use Clerk's authMiddleware
 * - Configure protected routes
 * - Handle authentication redirects
 *
 * Runs on routes matching the config.matcher pattern
 */

import { NextResponse } from 'next/server';

/**
 * middleware - Processes requests before they reach route handlers
 *
 * Currently a passthrough implementation. In production, this would:
 * 1. Check authentication status via Clerk
 * 2. Redirect unauthenticated users to login
 * 3. Add user context to requests
 *
 * @returns NextResponse to continue or redirect
 */
export default function middleware() {
  // Development mode: bypass all auth when USE_MOCK_AUTH is set
  if (process.env.USE_MOCK_AUTH === '1') {
    return NextResponse.next();
  }

  // Production would use Clerk here:
  // return clerkMiddleware()(request);

  // For now, allow all requests
  return NextResponse.next();
}

/**
 * Middleware configuration
 *
 * matcher: Defines which routes trigger the middleware
 * - Excludes static files (containing dots)
 * - Excludes Next.js internals (_next)
 * - Includes all pages and API routes
 */
export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
