'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Search, X } from 'lucide-react';
import {
  announcementsService,
  type Announcement,
  type AnnouncementsResponse,
} from '@/services/announcements.service';

const PAGE_SIZE = 6;

// Backend filters `type` by exact match, so a fixed list works better than free text.
// Edit the values to match the types you actually store.
const typeOptions = [
  { value: '', label: 'كل الأنواع' },
  { value: 'news', label: 'أخبار' },
  { value: 'offer', label: 'عروض' },
  { value: 'alert', label: 'تنبيهات' },
  { value: 'event', label: 'أحداث' },
];

const kindStyle: Record<string, string> = {
  عرض: 'bg-primary text-primary-foreground',
  جديد: 'bg-accent text-accent-foreground',
  تنبيه: 'bg-foreground text-background',
  حدث: 'bg-secondary text-secondary-foreground',
  news: 'bg-accent text-accent-foreground',
  offer: 'bg-primary text-primary-foreground',
  alert: 'bg-foreground text-background',
  event: 'bg-secondary text-secondary-foreground',
};

function getAnnouncementStyle(type: string) {
  return kindStyle[type] ?? 'bg-muted text-muted-foreground';
}

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: (number | '...')[] = [1];

  if (current > 3) {
    pages.push('...');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (current < total - 2) {
    pages.push('...');
  }

  pages.push(total);

  return pages;
}

const fieldClass =
  'h-11 w-full border border-border bg-white px-4 text-sm text-neutral-900 outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/10';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  const [pagination, setPagination] = useState<
    AnnouncementsResponse['pagination'] | null
  >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const listRef = useRef<HTMLElement>(null);

  // Typing waits a moment before hitting the API
  const debouncedSearch = useDebounced(search.trim());

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const response =
          await announcementsService.getPublicAnnouncements({
            page,
            limit: PAGE_SIZE,
            search: debouncedSearch,
            type,
            sort: 'newest',
          });

        if (!active) return;

        setAnnouncements(response.data);
        setPagination(response.pagination);
      } catch (err) {
        if (!active) return;

        setError(
          err instanceof Error
            ? err.message
            : 'تعذر تحميل الإعلانات حالياً.',
        );

        setAnnouncements([]);
        setPagination(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [page, debouncedSearch, type, reloadKey]);

  const hasActiveFilters = search !== '' || type !== '';
  const firstLoad = loading && announcements.length === 0 && !error;
  const isRefreshing = loading && announcements.length > 0;

  function resetFilters() {
    setSearch('');
    setType('');
    setPage(1);
  }

  function goToPage(nextPage: number) {
    setPage(nextPage);
    listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-white text-neutral-900"
    >
      {/* Page Header */}
      <section className="bg-white px-5 pb-12 pt-14 sm:pb-16 sm:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-sm font-semibold text-primary">
            — وكالة الشنة للسياحة والأسفار —
          </p>

          <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl md:text-6xl">
            الإعلانات
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
            تابع آخر أخبار الوكالة والعروض والمستجدات المتعلقة
            برحلاتنا وخدماتنا السياحية.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white px-5 pb-10">
        <div className="mx-auto max-w-5xl">
          <div className="border border-border bg-card p-4 md:p-5">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr]">
              <div>
                <label
                  htmlFor="announcement-search"
                  className="mb-1.5 block text-xs text-muted-foreground"
                >
                  البحث في الإعلانات
                </label>

                <div className="relative">
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    id="announcement-search"
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    placeholder="ابحث بعنوان الإعلان أو محتواه..."
                    className={`${fieldClass} pr-11`}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="announcement-type"
                  className="mb-1.5 block text-xs text-muted-foreground"
                >
                  نوع الإعلان
                </label>

                <select
                  id="announcement-type"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setPage(1);
                  }}
                  className={fieldClass}
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
              <p className="text-sm text-muted-foreground">
                {firstLoad ? (
                  'جاري التحميل...'
                ) : pagination ? (
                  <>
                    <span className="font-bold text-foreground">
                      {pagination.total}
                    </span>{' '}
                    إعلان
                  </>
                ) : null}
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
                >
                  <X className="h-4 w-4" />
                  مسح الفلاتر
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Announcements List */}
      <section
        ref={listRef}
        className="scroll-mt-6 bg-white px-5 pb-20 sm:pb-24"
      >
        <div className="mx-auto max-w-5xl">
          {firstLoad ? (
            <div className="space-y-5">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse bg-white p-6 sm:p-8"
                >
                  <div className="grid gap-5 md:grid-cols-12">
                    <div className="md:col-span-3">
                      <div className="h-12 w-16 bg-muted" />
                      <div className="mt-4 h-4 w-28 bg-muted" />
                    </div>

                    <div className="space-y-4 md:col-span-9">
                      <div className="h-6 w-20 bg-muted" />
                      <div className="h-7 w-3/4 bg-muted" />
                      <div className="h-4 w-full bg-muted" />
                      <div className="h-4 w-2/3 bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div
              role="alert"
              className="bg-white px-6 py-12 text-center"
            >
              <h2 className="text-xl font-bold">
                تعذر تحميل الإعلانات
              </h2>

              <p className="mt-3 leading-7 text-muted-foreground">
                {error}
              </p>

              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="mt-6 bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                إعادة المحاولة
              </button>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white px-6 py-16 text-center">
              <p className="text-sm font-semibold text-primary">
                لا توجد نتائج
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                لا توجد إعلانات حالياً
              </h2>

              <p className="mx-auto mt-4 max-w-lg leading-8 text-muted-foreground">
                لم نعثر على إعلانات تطابق بحثك. جرّب تغيير كلمات
                البحث أو مسح الفلاتر.
              </p>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-6 bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  عرض جميع الإعلانات
                </button>
              )}
            </div>
          ) : (
            <>
              <div
                className={`space-y-5 transition-opacity ${
                  isRefreshing ? 'opacity-60' : 'opacity-100'
                }`}
              >
                {announcements.map((announcement, index) => {
                  const date =
                    announcement.publishedAt ??
                    announcement.createdAt;

                  return (
                    <article
                      key={announcement.id}
                      className="group overflow-hidden border-b border-neutral-100 bg-white"
                    >
                      <div className="grid gap-5 p-6 sm:p-8 md:grid-cols-12 md:gap-7">
                        {/* Announcement Number and Date */}
                        <div className="md:col-span-3">
                          <p className="text-5xl font-bold tabular-nums text-primary/25">
                            {String(
                              (pagination?.page
                                ? (pagination.page - 1) * PAGE_SIZE
                                : 0) +
                                index +
                                1,
                            ).padStart(2, '0')}
                          </p>

                          <time
                            dateTime={date}
                            className="mt-3 block text-sm text-muted-foreground"
                          >
                            {new Date(date).toLocaleDateString(
                              'ar-DZ',
                              {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              },
                            )}
                          </time>
                        </div>

                        {/* Announcement Content */}
                        <div className="min-w-0 md:col-span-9">
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`inline-block px-3 py-1 text-xs font-semibold ${getAnnouncementStyle(announcement.type)}`}
                            >
                              {announcement.type}
                            </span>
                          </div>

                          <h2 className="mt-4 text-xl font-bold leading-8 transition-colors group-hover:text-primary sm:text-2xl">
                            {announcement.title}
                          </h2>

                          <p className="mt-3 whitespace-pre-line leading-8 text-muted-foreground">
                            {announcement.content}
                          </p>

                          {announcement.imageUrl && (
                            <div className="mt-6 overflow-hidden bg-muted">
                              <img
                                src={announcement.imageUrl}
                                alt={announcement.title}
                                loading="lazy"
                                className="max-h-[360px] w-full object-cover transition duration-500 group-hover:scale-[1.01]"
                              />
                            </div>
                          )}

                          <Link
                            href={`/announcements/${announcement.id}`}
                            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:opacity-75"
                          >
                            اقرأ الإعلان كاملاً
                            <span aria-hidden="true">←</span>
                          </Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages >= 1 && (
                <nav
                  aria-label="صفحات الإعلانات"
                  className="mt-12 flex flex-wrap items-center justify-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => goToPage(pagination.page - 1)}
                    disabled={!pagination.hasPreviousPage}
                    className="inline-flex h-11 items-center gap-2 border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-inherit"
                  >
                    <ArrowRight className="h-4 w-4" />
                    السابقة
                  </button>

                  {getPageNumbers(
                    pagination.page,
                    pagination.totalPages,
                  ).map((item, index) =>
                    item === '...' ? (
                      <span
                        key={`gap-${index}`}
                        className="px-2 text-muted-foreground"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        type="button"
                        onClick={() => goToPage(item)}
                        aria-current={
                          item === pagination.page ? 'page' : undefined
                        }
                        className={`h-11 min-w-11 border px-3 text-sm font-semibold transition ${
                          item === pagination.page
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        {item}
                      </button>
                    ),
                  )}

                  <button
                    type="button"
                    onClick={() => goToPage(pagination.page + 1)}
                    disabled={!pagination.hasNextPage}
                    className="inline-flex h-11 items-center gap-2 border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-inherit"
                  >
                    التالية
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}