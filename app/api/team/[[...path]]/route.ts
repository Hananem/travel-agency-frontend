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
    const apiPath = pathname.replace(/^\/api\/team/, '');

    const token = (await cookies()).get('admin_session')?.value;

    // الفريق المنشور متاح للزوار دون تسجيل الدخول:
    // - القائمة: /api/team
    // - عضو مباشرة: /api/team/<id>
    // أما /admin/... فتتطلب تسجيل دخول المدير.
    const isPublicGet =
      request.method === 'GET' &&
      (apiPath === '' || apiPath === '/' || /^\/[^/]+$/.test(apiPath)) &&
      !apiPath.startsWith('/admin');

    if (!isPublicGet && !token) {
      return NextResponse.json(
        { message: 'يرجى تسجيل الدخول.' },
        { status: 401 },
      );
    }

    const url = `${backendUrl}/team${apiPath}${request.nextUrl.search}`;

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
    console.error('Team proxy error:', error);

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