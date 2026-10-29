import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// المسارات المسموح بتمريرها فقط (whitelist)
const ALLOWED_PATHS: Record<string, string> = {
  '': 'stats', // /api/dashboard -> /dashboard/stats
  'bookings-timeline': 'bookings-timeline',
  'top-trips': 'top-trips',
  'cancellation-rate': 'cancellation-rate',
  'bookings-by-destination': 'bookings-by-destination',
  travelers: 'travelers',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  try {
    const token = (await cookies()).get('admin_session')?.value;
    const backendUrl = process.env.BACKEND_URL;

    if (!token) {
      return NextResponse.json(
        { message: 'يرجى تسجيل الدخول.' },
        { status: 401 },
      );
    }

    if (!backendUrl) {
      return NextResponse.json(
        { message: 'BACKEND_URL غير مضبوط.' },
        { status: 500 },
      );
    }

    const { path } = await params;
    const key = (path ?? []).join('/');
    const target = ALLOWED_PATHS[key];

    if (!target) {
      return NextResponse.json(
        { message: 'المسار غير موجود.' },
        { status: 404 },
      );
    }

    const search = request.nextUrl.search; // يمرر ?range=30d وغيره

    const response = await fetch(`${backendUrl}/dashboard/${target}${search}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    const body = await response.text();

    return new NextResponse(body, {
      status: response.status,
      headers: {
        'Content-Type':
          response.headers.get('Content-Type') ?? 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'تعذر الاتصال بالخادم.' },
      { status: 503 },
    );
  }
}