
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL =
  process.env.BACKEND_URL ?? 'http://localhost:3000';

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxyRequest(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const { path = [] } = await context.params;
    const pathname = path.join('/');
    const method = request.method;

    // Public read endpoints
    const isPublicGet =
      method === 'GET' &&
      (pathname === '' || pathname === 'public');

    // All other requests require an admin session
    const token = request.cookies.get('admin_session')?.value;

    if (!isPublicGet && !token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 },
      );
    }

    const targetUrl = new URL(
      `${BACKEND_URL}/announcements${pathname ? `/${pathname}` : ''}`,
    );

    targetUrl.search = request.nextUrl.search;

    const headers = new Headers();
    headers.set('Accept', 'application/json');

    const contentType = request.headers.get('content-type');
    if (contentType) {
      headers.set('Content-Type', contentType);
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const body =
      method === 'GET' || method === 'HEAD'
        ? undefined
        : await request.text();

    const response = await fetch(targetUrl.toString(), {
      method,
      headers,
      body,
      cache: 'no-store',
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody || null, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('content-type') ??
          'application/json',
      },
    });
  } catch (error) {
    console.error('Announcements proxy error:', error);

    return NextResponse.json(
      { message: 'Failed to connect to announcements service' },
      { status: 502 },
    );
  }
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  return proxyRequest(request, context);
}
