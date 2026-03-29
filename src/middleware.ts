import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Generate a unique Request ID
  const requestId = crypto.randomUUID();

  // Clone headers and add X-Request-Id to request info
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  // Create response with the cloned headers
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Inject X-Request-Id into the response header for the client
  response.headers.set('x-request-id', requestId);

  return response;
}

// Apply to all API routes
export const config = {
  matcher: '/api/:path*',
};
