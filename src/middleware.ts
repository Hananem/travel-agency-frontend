import { NextRequest, NextResponse } from 'next/server';

function isTokenValid(token?: string): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  const valid = isTokenValid(token);
  const isLoginPage = request.nextUrl.pathname === '/admin/login';

  // مسجل دخول وفتح صفحة الدخول ← حوّله للداشبورد
  if (isLoginPage && valid) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // غير مسجل أو التوكن منتهي ← حوّله لصفحة الدخول
  if (!isLoginPage && !valid) {
    const res = NextResponse.redirect(new URL('/admin/login', request.url));
    res.cookies.delete('admin_session');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};