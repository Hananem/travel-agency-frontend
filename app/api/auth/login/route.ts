
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== 'object' ||
      !('email' in body) ||
      !('password' in body) ||
      typeof body.email !== 'string' ||
      typeof body.password !== 'string' ||
      !body.email.trim() ||
      !body.password
    ) {
      return NextResponse.json(
        { message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' },
        { status: 400 },
      );
    }

    const backendUrl = process.env.BACKEND_URL;

    if (!backendUrl) {
      return NextResponse.json(
        { message: 'عنوان الخادم غير مضبوط.' },
        { status: 500 },
      );
    }

    const backendResponse = await fetch(
      `${backendUrl}/auth/login`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: body.email.trim(),
          password: body.password,
        }),
        cache: 'no-store',
      },
    );

    if (backendResponse.status === 401) {
      return NextResponse.json(
        { message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' },
        { status: 401 },
      );
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: 'تعذر تسجيل الدخول.' },
        { status: 502 },
      );
    }

    const data = await backendResponse.json();

    if (
      typeof data.access_token !== 'string' ||
      !data.access_token ||
      !data.admin?.id ||
      !data.admin?.email
    ) {
      return NextResponse.json(
        { message: 'استجابة الخادم غير صالحة.' },
        { status: 502 },
      );
    }

    const response = NextResponse.json({
      admin: {
        id: data.admin.id,
        email: data.admin.email,
      },
    });

    response.cookies.set('admin_session', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60,
    });

    return response;
  } catch {
    return NextResponse.json(
      { message: 'تعذر الاتصال بالخادم.' },
      { status: 503 },
    );
  }
}
