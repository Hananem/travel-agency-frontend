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
    const apiPath = pathname.replace(/^\/api\/trips/, '');

    const token = (await cookies()).get('admin_session')?.value;

    const isPublicGet =
      request.method === 'GET' &&
      (apiPath === '' ||
        apiPath === '/' ||
        apiPath.startsWith('/slug/') ||
        /^\/[^/]+$/.test(apiPath));

    if (!isPublicGet && !token) {
      return NextResponse.json(
        { message: 'يرجى تسجيل الدخول.' },
        { status: 401 },
      );
    }

    let backendPath = apiPath;

    if (
      request.method === 'GET' &&
      /^\/[^/]+$/.test(apiPath) &&
      !apiPath.startsWith('/slug')
    ) {
      backendPath = `/slug${apiPath}`;
    }

    const url = `${backendUrl}/trips${backendPath}${request.nextUrl.search}`;

    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let body: ArrayBuffer | undefined;

    if (request.method === 'POST' || request.method === 'PATCH') {
      // نمرّر نوع المحتوى الأصلي (JSON أو multipart مع الـ boundary)
      const contentType = request.headers.get('content-type');
      if (contentType) {
        headers['Content-Type'] = contentType;
      }

      // نمرّر الجسم كبايتات كما هو بدون تحويله إلى نص
      body = await request.arrayBuffer();
    }

    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
    });

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
    console.error('Trips proxy error:', error);

    return NextResponse.json(
      {
        message: 'تعذر الاتصال بالخادم.',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
  }
}

export const GET = proxyToBackend;
export const POST = proxyToBackend;
export const PATCH = proxyToBackend;
export const DELETE = proxyToBackend;