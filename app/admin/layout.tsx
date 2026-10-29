import { Suspense, type ReactNode } from 'react';
import AdminShell from './admin-shell';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div dir="rtl" className="min-h-screen bg-white">
          <aside className="fixed inset-y-0 right-0 w-64 border-l border-border bg-white" />
        </div>
      }
    >
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
