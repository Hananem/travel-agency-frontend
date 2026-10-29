'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Map,
  Megaphone,
  Users,
  Settings,
  Globe,
  LogOut,
  Plane,
  MapPin,
  ClipboardList,
} from 'lucide-react';

const navigation = [
  {
    title: 'لوحة التحكم',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'الرحلات السياحية',
    href: '/admin/trips',
    icon: Map,
  },
  {
    title: 'الحجوزات',
    href: '/admin/bookings',
    icon: ClipboardList,
  },
  {
    title: 'الوجهات السياحية',
    href: '/admin/destinations',
    icon: MapPin,
  },
  {
    title: 'الإعلانات والأخبار',
    href: '/admin/announcements',
    icon: Megaphone,
  },
  {
    title: 'فريق العمل',
    href: '/admin/team',
    icon: Users,
  },
  {
    title: 'الإعدادات',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      dir="rtl"
      className="fixed inset-y-0 right-0 z-40 flex w-64 flex-col bg-foreground text-white"
    >
      {/* Brand */}
      <div className="flex h-24 items-center gap-3 px-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-primary-foreground">
          <Plane size={22} />
        </span>

        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-white">
            وكالة الشنة
          </h1>
          <p className="mt-0.5 text-xs text-white/60">
            إدارة وكالة السياحة والأسفار
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 pt-6">
        <span className="mb-4 block px-3 text-sm font-semibold text-white/60">
          القائمة الرئيسية
        </span>

        <nav className="space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;

            const active =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-3.5 text-sm transition ${
                  active
                    ? 'bg-white/10 font-bold text-white'
                    : 'font-medium text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={19} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer actions */}
      <div className="space-y-1 p-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3 py-3.5 text-sm font-medium text-white/70 transition hover:bg-white/5 hover:text-white"
        >
          <Globe size={19} />
          عرض الموقع
        </Link>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/admin/login';
          }}
          className="flex w-full items-center gap-3 px-3 py-3.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
        >
          <LogOut size={19} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}