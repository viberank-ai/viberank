import { NextResponse } from 'next/server';

// Simple middleware that allows all routes in mock mode
export default function middleware() {
  // If using mock auth, just allow everything
  if (process.env.USE_MOCK_AUTH === '1') {
    return NextResponse.next();
  }

  // For real auth, we'd need proper Clerk setup
  // For now, just allow everything since we're in development
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
