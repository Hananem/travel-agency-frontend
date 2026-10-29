'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/admin/Sidebar';

export default function AdminShell({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  // صفحة الدخول تظهر وحدها، بدون Sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-white">
      <Sidebar />

      <main className="min-h-screen pr-64">
        <div className="mx-auto max-w-7xl p-6 lg:p-10">
          {children}
        </div>
      </main>
    </div>
  );
}