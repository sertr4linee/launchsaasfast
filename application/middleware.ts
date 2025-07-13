
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  // Middleware désactivé, tout passe
  return NextResponse.next();
}

export const config = {
  matcher: ['/profile/:path*', '/auth/:path*'],
};
