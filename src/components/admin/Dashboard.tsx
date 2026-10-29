'use client';

import {
  Map,
  Megaphone,
  Users,
  TrendingUp,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  getBookingsByDestination,
  getBookingsTimeline,
  getCancellationRates,
  getDashboard,
  getTopTrips,
  getTravelersStats,
  type TimelineRange,
} from '@/services/dashboard.service';

const STATUS_COLORS = {
  confirmed: '#16a34a',
  pending: '#f59e0b',
  cancelled: '#dc2626',
};

function ChartCard({
  title,
  description,
  isLoading,
  isError,
  isEmpty,
  action,
  children,
}: {
  title: string;
  description: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="border border-border p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold md:text-lg">{title}</h3>
          <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm">
            {description}
          </p>
        </div>
        {action}
      </div>

      <div className="h-72" dir="ltr">
        {isLoading ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            جارٍ التحميل...
          </p>
        ) : isError ? (
          <p className="flex h-full items-center justify-center text-sm text-red-600">
            تعذر تحميل البيانات.
          </p>
        ) : isEmpty ? (
          <p className="flex h-full items-center justify-center text-sm text-muted-foreground">
            لا توجد بيانات بعد.
          </p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [range, setRange] = useState<TimelineRange>('30d');

  const {
    data: dashboardData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
  });

  const timeline = useQuery({
    queryKey: ['dashboard', 'timeline', range],
    queryFn: () => getBookingsTimeline(range),
  });

  const topTrips = useQuery({
    queryKey: ['dashboard', 'top-trips'],
    queryFn: () => getTopTrips(5),
  });

  const cancellation = useQuery({
    queryKey: ['dashboard', 'cancellation-rate'],
    queryFn: () => getCancellationRates(3),
  });

  const destinations = useQuery({
    queryKey: ['dashboard', 'destinations'],
    queryFn: getBookingsByDestination,
  });

  const travelers = useQuery({
    queryKey: ['dashboard', 'travelers'],
    queryFn: getTravelersStats,
  });

  const bookings = dashboardData?.bookings;

  const statusData = bookings
    ? [
        {
          name: 'مؤكدة',
          value: bookings.confirmed.count,
          color: STATUS_COLORS.confirmed,
        },
        {
          name: 'قيد الانتظار',
          value: bookings.pending.count,
          color: STATUS_COLORS.pending,
        },
        {
          name: 'ملغاة',
          value: bookings.cancelled.count,
          color: STATUS_COLORS.cancelled,
        },
      ]
    : [];

  const stats = [
    {
      title: 'إجمالي الرحلات',
      value: isLoading
        ? '...'
        : isError
          ? '—'
          : String(dashboardData?.trips ?? 0),
      description: 'عدد الرحلات التي تديرها الوكالة',
      icon: Map,
    },
    {
      title: 'الإعلانات والأخبار',
      value: isLoading
        ? '...'
        : isError
          ? '—'
          : String(dashboardData?.announcements ?? 0),
      description: 'الأخبار والعروض السياحية الخاصة',
      icon: Megaphone,
    },
    {
      title: 'أعضاء فريق العمل',
      value: isLoading
        ? '...'
        : isError
          ? '—'
          : String(dashboardData?.teamMembers ?? 0),
      description: 'أعضاء الفريق المعروضون على الموقع',
      icon: Users,
    },
    {
      title: 'المسافرون الفعليون',
      value: travelers.isLoading
        ? '...'
        : travelers.isError
          ? '—'
          : String(travelers.data?.totalActiveTravelers ?? 0),
      description: 'الحجوزات المؤكدة والمنتظرة مع المرافقين',
      icon: Users,
    },
  ];

  const quickActions = [
    {
      number: '01',
      title: 'إضافة رحلة جديدة',
      description: 'إنشاء رحلة سياحية وإعدادها للنشر.',
      href: '/admin/trips/new',
    },
    {
      number: '02',
      title: 'إضافة إعلان جديد',
      description: 'نشر الأخبار والتغييرات والعروض الخاصة.',
      href: '/admin/announcements/new',
    },
    {
      number: '03',
      title: 'إدارة فريق العمل',
      description: 'إضافة أعضاء الفريق وتحديث معلوماتهم.',
      href: '/admin/team',
    },
  ];

  return (
    <main dir="rtl" className="space-y-16 text-foreground">
      {/* Header */}
      <section className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <span className="text-sm font-semibold text-primary">
            مرحبًا بك في لوحة التحكم
          </span>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            لوحة التحكم
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
            إدارة وكالة السياحة والأسفار من مكان واحد.
          </p>
        </div>

        <Link
          href="/admin/trips/new"
          className="inline-flex w-fit items-center justify-center gap-2 bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90"
        >
          <Plus size={18} />
          إضافة رحلة جديدة
        </Link>
      </section>

      {/* Stats */}
      <section>
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.title} className="border-b border-border pb-6">
                <div className="flex items-start justify-between gap-4">
                  <p className="text-4xl font-extrabold tracking-tight md:text-5xl">
                    {stat.value}
                  </p>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/40 text-primary">
                    <Icon size={18} />
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold md:text-base">
                  {stat.title}
                </h3>

                <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {isError && (
          <p role="alert" className="mt-6 text-sm text-red-600">
            تعذر تحميل الإحصائيات. تحققي من تسجيل الدخول واتصال الخادم.
          </p>
        )}
      </section>

      {/* Analytics */}
      <section>
        <div className="mb-8">
          <span className="text-sm font-semibold text-primary">
            التحليلات
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">
            أداء الحجوزات
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            نظرة سريعة على الحجوزات والرحلات والوجهات الأكثر طلباً.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1) حالات الحجوزات */}
          <ChartCard
            title="حالات الحجوزات"
            description="نسبة الحجوزات المؤكدة والمنتظرة والملغاة"
            isLoading={isLoading}
            isError={isError}
            isEmpty={!bookings || bookings.total === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                >
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const total = bookings?.total || 1;
                    const pct = Math.round((Number(value) / total) * 1000) / 10;
                    return [`${value} (${pct}%)`, name];
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 2) الحجوزات عبر الزمن */}
          <ChartCard
            title="الحجوزات عبر الزمن"
            description="تطور عدد الحجوزات لمعرفة المواسم والنمو"
            isLoading={timeline.isLoading}
            isError={timeline.isError}
            isEmpty={!timeline.data || timeline.data.every((p) => p.count === 0)}
            action={
              <div className="flex shrink-0 border border-border text-xs">
                {(['30d', '12m'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 transition ${
                      range === r
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {r === '30d' ? '30 يوم' : '12 شهر'}
                  </button>
                ))}
              </div>
            }
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeline.data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value) => [String(value), 'الحجوزات']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#2563eb"
                  fill="#2563eb"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 3) أكثر الرحلات حجزاً */}
          <ChartCard
            title="أكثر الرحلات حجزاً"
            description="أفضل 5 رحلات من حيث عدد الحجوزات"
            isLoading={topTrips.isLoading}
            isError={topTrips.isError}
            isEmpty={!topTrips.data || topTrips.data.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topTrips.data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value) => [String(value), 'الحجوزات']} />
                <Bar dataKey="bookings" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 4) معدل الإلغاء لكل رحلة */}
          <ChartCard
            title="معدل الإلغاء لكل رحلة"
            description="الرحلات التي لديها 3 حجوزات فأكثر"
            isLoading={cancellation.isLoading}
            isError={cancellation.isError}
            isEmpty={!cancellation.data || cancellation.data.length === 0}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cancellation.data} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="title"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value, _name, item) => [
                    `${value}% (${item.payload.cancelled} من ${item.payload.total})`,
                    'معدل الإلغاء',
                  ]}
                />
                <Bar dataKey="rate" fill={STATUS_COLORS.cancelled} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* 5) الحجوزات حسب الوجهة */}
          <div className="lg:col-span-2">
            <ChartCard
              title="الحجوزات حسب الوجهة"
              description="الوجهات الأكثر طلباً"
              isLoading={destinations.isLoading}
              isError={destinations.isError}
              isEmpty={!destinations.data || destinations.data.length === 0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={destinations.data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="destination" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => [String(value), 'الحجوزات']} />
                  <Bar dataKey="count" fill="#0d9488" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section>
        <div className="mb-8">
          <span className="text-sm font-semibold text-primary">
            ابدأ من هنا
          </span>

          <h2 className="mt-3 text-2xl font-bold tracking-tight md:text-4xl">
            الإجراءات السريعة
          </h2>

          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            الوصول إلى المهام الأساسية للوكالة.
          </p>
        </div>

        <div className="border-t border-border">
          {quickActions.map((action) => (
            <Link
              key={action.number}
              href={action.href}
              className="group flex items-center justify-between gap-6 border-b border-border py-7"
            >
              <div className="flex items-start gap-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-sm font-bold transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                  {action.number}
                </span>

                <div>
                  <h3 className="text-lg font-bold md:text-xl">
                    {action.title}
                  </h3>

                  <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/40 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowLeft className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Agency overview */}
      <section className="bg-foreground px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="flex items-start gap-5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/40 text-white">
            <TrendingUp size={20} />
          </span>

          <div>
            <span className="text-sm font-semibold text-white/70">
              ملخص
            </span>

            <h2 className="mt-2 text-xl font-bold sm:text-2xl">
              نظرة عامة على الوكالة
            </h2>

            <p className="mt-2 text-sm text-white/75">
              {isLoading
                ? 'جارٍ تحميل إحصائيات الوكالة...'
                : isError
                  ? 'تعذر تحميل بيانات الوكالة.'
                  : 'تم تحميل إحصائيات الوكالة من قاعدة البيانات.'}
            </p>

            <p className="mt-4 max-w-2xl leading-8 text-white/75">
              تعرض هذه الصفحة أعداد الرحلات والإعلانات وأعضاء فريق العمل
              والحجوزات المسجلة في قاعدة البيانات.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}