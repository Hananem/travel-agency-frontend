import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

async function proxyToBackend(request: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { message: 'عنوان الخادم غير مضبوط.' },
        { status: 500 },
      );
    }

    const pathname = request.nextUrl.pathname;
    const apiPath = pathname.replace(/^\/api\/destinations/, '');
    const url = `${backendUrl}/destinations${apiPath}${request.nextUrl.search}`;

    const token = (await cookies()).get('admin_session')?.value;

    const isPublicGet =
      request.method === 'GET' &&
      (apiPath === '' ||
        apiPath === '/' ||
        apiPath.startsWith('/slug/'));

    if (!isPublicGet && !token) {
      return NextResponse.json(
        { message: 'يرجى تسجيل الدخول.' },
        { status: 401 },
      );
    }

    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let body: string | undefined;

    if (request.method === 'POST' || request.method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
      body = await request.text();
    }

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

    // سطر للتشخيص: يظهر في terminal مشروع Next.js
    console.log(`[destinations proxy] ${request.method} ${url} -> ${response.status}`);

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const data = await response.text();

    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch (error) {
    console.error('Destinations proxy error:', error);

    return NextResponse.json(
      {
        message: 'تعذر الاتصال بالخادم.',
        error:
          error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;