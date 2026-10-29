'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  tripsService,
  type PublicTripsParams,
} from '@/services/trips.service';

const PAGE_SIZE = 6;

type Sort = NonNullable<PublicTripsParams['sort']>;

type Filters = {
  search: string;
  minPrice: string;
  maxPrice: string;
};

const emptyFilters: Filters = { search: '', minPrice: '', maxPrice: '' };

const formatPrice = (price: number | string) =>
  new Intl.NumberFormat('fr-DZ', {
    maximumFractionDigits: 0,
  }).format(Number(price)) + ' DZD';

// المدة قد تكون رقماً (5) أو نصاً حراً ("5 أيام / 4 ليالٍ")
function formatDuration(duration: string | number) {
  const text = String(duration).trim();
  return /^\d+$/.test(text) ? `${text} أيام` : text;
}

function toNumber(value: string): number | undefined {
  if (value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function ExplorePage() {
  // القيم داخل الحقول (لا تُرسل للـ API إلا عند الضغط على "البحث")
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  // القيم المطبّقة فعلياً على الطلب
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState<Sort>('default');
  const [page, setPage] = useState(1);

  const params: PublicTripsParams = {
    page,
    limit: PAGE_SIZE,
    search: applied.search.trim() || undefined,
    minPrice: toNumber(applied.minPrice),
    maxPrice: toNumber(applied.maxPrice),
    sort,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['trips', 'explore', params],
    queryFn: () => tripsService.getPublicTrips(params),
    placeholderData: keepPreviousData,
  });

  const trips = data?.data ?? [];
  const totalPages = Math.max(1, data?.pagination?.totalPages ?? 1);

  function updateDraft(field: keyof Filters, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplied(draft);
    setPage(1);
  }

  function resetFilters() {
    setDraft(emptyFilters);
    setApplied(emptyFilters);
    setSort('default');
    setPage(1);
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 text-right">
          <h1 className="text-3xl font-bold text-gray-900">
            اكتشف رحلاتنا
          </h1>
          <p className="mt-2 text-gray-600">
            اختر وجهتك القادمة واكتشف الرحلات المتاحة.
          </p>
        </header>

        <form
          onSubmit={handleSearch}
          className="mb-8 grid grid-cols-1 gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-5"
        >
          <div className="sm:col-span-2 lg:col-span-2">
            <label
              htmlFor="trip-search"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              ابحث عن رحلة أو وجهة
            </label>
            <input
              id="trip-search"
              type="search"
              value={draft.search}
              onChange={(event) => updateDraft('search', event.target.value)}
              placeholder="اسم الرحلة أو الوجهة..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="min-price"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              أقل سعر (DZD)
            </label>
            <input
              id="min-price"
              type="number"
              min="0"
              value={draft.minPrice}
              onChange={(event) =>
                updateDraft('minPrice', event.target.value)
              }
              placeholder="من"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="max-price"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              أعلى سعر (DZD)
            </label>
            <input
              id="max-price"
              type="number"
              min="0"
              value={draft.maxPrice}
              onChange={(event) =>
                updateDraft('maxPrice', event.target.value)
              }
              placeholder="إلى"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="trip-sort"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              الترتيب
            </label>
            <select
              id="trip-sort"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as Sort);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-600"
            >
              <option value="default">الافتراضي</option>
              <option value="price-asc">السعر: من الأقل للأعلى</option>
              <option value="price-desc">السعر: من الأعلى للأقل</option>
            </select>
          </div>

          <div className="flex flex-wrap items-end gap-2 sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-6 py-2.5 font-medium text-white transition hover:bg-blue-800"
            >
              البحث
            </button>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-gray-300 px-6 py-2.5 font-medium text-gray-700 transition hover:bg-gray-100"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        </form>

        {isLoading ? (
          <div className="py-20 text-center text-gray-600" role="status">
            جارٍ تحميل الرحلات...
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
            <p>
              {error instanceof Error
                ? error.message
                : 'تعذر تحميل الرحلات. حاول مرة أخرى.'}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-lg bg-red-700 px-5 py-2 text-white hover:bg-red-800"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              لا توجد رحلات مطابقة
            </h2>
            <p className="mt-2 text-gray-500">
              جرّب تغيير كلمات البحث أو نطاق السعر.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                الرحلات المتاحة في هذه الصفحة: {trips.length}
              </p>
              <p className="text-sm text-gray-600">
                الصفحة {page} من {totalPages}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {trips.map((trip) => (
                <article
                  key={trip.id}
                  className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <Link
                    href={`/explore/${trip.slug || trip.id}`}
                    className="block"
                  >
                    <div className="relative flex h-56 items-center justify-center overflow-hidden bg-gray-100">
                      {trip.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={trip.imageUrl}
                          alt={trip.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">
                          لا توجد صورة
                        </span>
                      )}
                    </div>

                    <div className="p-5 text-right">
                      <p className="mb-2 text-sm text-blue-700">
                        {trip.destination}
                      </p>

                      <h2 className="text-xl font-bold text-gray-900">
                        {trip.title}
                      </h2>

                      {trip.description && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-600">
                          {trip.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                        <span className="text-lg font-bold text-blue-700">
                          {formatPrice(trip.price)}
                        </span>

                        <span className="text-sm text-gray-500">
                          {formatDuration(trip.duration)}
                        </span>
                      </div>

                      <div className="mt-4 rounded-lg bg-blue-700 py-2.5 text-center font-medium text-white transition hover:bg-blue-800">
                        عرض تفاصيل الرحلة
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            <nav
              aria-label="التنقل بين صفحات الرحلات"
              className="mt-10 flex items-center justify-center gap-4"
            >
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="rounded-lg border border-gray-300 px-5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                السابقة
              </button>

              <span className="text-sm text-gray-700">
                {page} / {totalPages}
              </span>

              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="rounded-lg border border-gray-300 px-5 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                التالية
              </button>
            </nav>
          </>
        )}
      </div>
    </main>
  );
}