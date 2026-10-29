"use client";

import { useEffect, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Plane,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

const tripImages = ["/trip1.jpg", "/trip2.jpg", "/trip3.jpg"];

const PAGE_SIZE = 8;

type Trip = {
  id: string;
  title: string;
  slug: string;
  destination: string;
  description?: string | null;
  price?: number | string | null;
  duration?: string | null;
  imageUrl?: string | null;
  isPublished?: boolean;
  createdAt?: string | null;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type TripsResponse = {
  data: Trip[];
  pagination: Pagination;
};

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("تعذر تحميل البيانات");
  }

  return response.json();
}

function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const pages: (number | "...")[] = [1];

  if (current > 3) {
    pages.push("...");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (current < total - 2) {
    pages.push("...");
  }

  pages.push(total);

  return pages;
}

function LoadingCards() {
  return (
    <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
        <div key={item} className="min-w-0 animate-pulse">
          <div className="h-[280px] bg-muted md:h-[380px]" />
          <div className="space-y-3 py-4">
            <div className="h-4 w-1/2 bg-muted" />
            <div className="h-5 w-3/4 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

const fieldClass =
  "h-11 w-full border border-border bg-background px-4 text-sm outline-none transition focus:border-primary";

export default function TripsPage() {
  const [search, setSearch] = useState("");
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const gridRef = useRef<HTMLElement>(null);

  // Text and number fields wait a moment before hitting the API
  const debouncedSearch = useDebounced(search.trim());
  const debouncedDestination = useDebounced(destination.trim());
  const debouncedDuration = useDebounced(duration.trim());
  const debouncedMin = useDebounced(minPrice);
  const debouncedMax = useDebounced(maxPrice);

  const priceRangeInvalid =
    minPrice !== "" &&
    maxPrice !== "" &&
    Number(minPrice) > Number(maxPrice);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(PAGE_SIZE));

  if (debouncedSearch) params.set("search", debouncedSearch);
  if (debouncedDestination) params.set("destination", debouncedDestination);
  if (debouncedDuration) params.set("duration", debouncedDuration);
  if (debouncedMin !== "") params.set("minPrice", debouncedMin);
  if (debouncedMax !== "") params.set("maxPrice", debouncedMax);

  const queryString = params.toString();

  const tripsQuery = useQuery({
    queryKey: ["trips", queryString],
    queryFn: () => fetchApi<TripsResponse>(`/api/trips?${queryString}`),
    placeholderData: keepPreviousData,
    enabled: !priceRangeInvalid,
  });

  const trips = tripsQuery.data?.data ?? [];
  const pagination = tripsQuery.data?.pagination;

  const hasActiveFilters =
    search !== "" ||
    destination !== "" ||
    duration !== "" ||
    minPrice !== "" ||
    maxPrice !== "";

  function resetFilters() {
    setSearch("");
    setDestination("");
    setDuration("");
    setMinPrice("");
    setMaxPrice("");
    setPage(1);
  }

  // Any filter change goes back to the first page of results
  function withReset<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setPage(1);
    };
  }

  function goToPage(nextPage: number) {
    setPage(nextPage);
    gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const isRefetching = tripsQuery.isFetching && !tripsQuery.isLoading;

  return (
    <main dir="rtl" className="overflow-hidden bg-white text-neutral-900">
      {/* Page header */}
      <section className="mx-auto max-w-7xl px-5 pt-10 md:pt-14">
        <p className="mb-3 text-sm font-semibold text-primary">
          وكالة الشنة للسفر والسياحة
        </p>

        <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
          جميع الرحلات
        </h1>

        <p className="mt-4 max-w-xl text-sm leading-8 text-muted-foreground md:text-base">
          تصفّح رحلاتنا السياحية المنشورة، وابحث أو صفّ النتائج للوصول إلى
          الرحلة التي تناسبك.
        </p>
      </section>

      {/* Filters */}
      <section className="mx-auto mt-8 max-w-7xl px-5">
        <div className="border border-border bg-card p-4 shadow-sm md:p-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            {/* Search (always visible) */}
            <div className="col-span-2 lg:col-span-1">
              <span className="mb-1.5 block text-xs text-muted-foreground">
                بحث
              </span>

              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) =>
                      withReset(setSearch)(event.target.value)
                    }
                    placeholder="ابحث عن رحلة..."
                    aria-label="بحث"
                    className={`${fieldClass} pr-11`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setFiltersOpen((open) => !open)}
                  aria-expanded={filtersOpen}
                  className="flex h-11 shrink-0 items-center gap-2 border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary lg:hidden"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  الفلاتر
                </button>
              </div>
            </div>

            <label className={filtersOpen ? "block" : "hidden lg:block"}>
              <span className="mb-1.5 block text-xs text-muted-foreground">
                الوجهة
              </span>

              <input
                type="text"
                value={destination}
                onChange={(event) =>
                  withReset(setDestination)(event.target.value)
                }
                placeholder="مثال: إسطنبول"
                className={fieldClass}
              />
            </label>

            <label className={filtersOpen ? "block" : "hidden lg:block"}>
              <span className="mb-1.5 block text-xs text-muted-foreground">
                المدة
              </span>

              <input
                type="text"
                value={duration}
                onChange={(event) =>
                  withReset(setDuration)(event.target.value)
                }
                placeholder="مثال: 5 أيام"
                className={fieldClass}
              />
            </label>

            <label className={filtersOpen ? "block" : "hidden lg:block"}>
              <span className="mb-1.5 block text-xs text-muted-foreground">
                السعر الأدنى (دج)
              </span>

              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={minPrice}
                onChange={(event) =>
                  withReset(setMinPrice)(event.target.value)
                }
                placeholder="0"
                className={fieldClass}
              />
            </label>

            <label className={filtersOpen ? "block" : "hidden lg:block"}>
              <span className="mb-1.5 block text-xs text-muted-foreground">
                السعر الأقصى (دج)
              </span>

              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={maxPrice}
                onChange={(event) =>
                  withReset(setMaxPrice)(event.target.value)
                }
                placeholder="بدون حد"
                className={fieldClass}
              />
            </label>
          </div>

          {priceRangeInvalid && (
            <p role="alert" className="mt-3 text-sm text-red-600">
              السعر الأدنى يجب ألا يكون أكبر من السعر الأقصى.
            </p>
          )}

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm text-muted-foreground">
              {tripsQuery.isLoading ? (
                "جاري التحميل..."
              ) : pagination ? (
                <>
                  <span className="font-bold text-foreground">
                    {pagination.total}
                  </span>{" "}
                  رحلة
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
      </section>

      {/* Trips grid */}
      <section
        ref={gridRef}
        className="mx-auto mb-28 mt-10 max-w-7xl scroll-mt-6 px-5"
      >
        {tripsQuery.isLoading ? (
          <LoadingCards />
        ) : tripsQuery.isError ? (
          <div className="p-8 text-center">
            <p className="font-semibold">تعذر تحميل الرحلات حاليًا.</p>

            <button
              onClick={() => tripsQuery.refetch()}
              className="mt-4 bg-primary px-5 py-2 text-sm text-primary-foreground"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : trips.length === 0 ? (
          hasActiveFilters ? (
            <div className="px-6 py-12 text-center">
              <Search className="mx-auto h-8 w-8 text-primary" />

              <h3 className="mt-4 text-lg font-bold">لا توجد نتائج مطابقة</h3>

              <p className="mt-2 text-sm text-muted-foreground">
                جرّب تغيير كلمات البحث أو تعديل الفلاتر.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 inline-flex bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                مسح الفلاتر
              </button>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <Plane className="mx-auto h-8 w-8 text-primary" />

              <h3 className="mt-4 text-lg font-bold">رحلاتنا قريبًا</h3>

              <p className="mt-2 text-sm text-muted-foreground">
                لا توجد رحلات منشورة حاليًا. تواصل معنا للاستفسار عن برامج
                السفر.
              </p>

              <Link
                href="/contact"
                className="mt-5 inline-flex bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                تواصل معنا
              </Link>
            </div>
          )
        ) : (
          <>
            <div
              className={`grid grid-cols-2 gap-5 transition-opacity md:grid-cols-3 lg:grid-cols-4 ${
                isRefetching ? "opacity-60" : "opacity-100"
              }`}
            >
              {trips.map((trip, index) => {
                const price = formatPrice(trip.price);
                const href = `/trips/${trip.slug || trip.id}`;

                return (
                  <Link
                    key={trip.id}
                    href={href}
                    aria-label={`عرض الرحلة: ${trip.title}`}
                    className="group block min-w-0 overflow-hidden"
                  >
                    <article>
                      <div className="relative overflow-hidden">
                        <img
                          src={
                            trip.imageUrl ||
                            tripImages[index % tripImages.length]
                          }
                          alt={trip.title}
                          loading="lazy"
                          width={300}
                          height={420}
                          className="h-[280px] w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-[380px]"
                        />

                        <span className="absolute right-3 top-3 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                          رحلة سياحية
                        </span>
                      </div>

                      <div className="pt-4">
                        <p className="text-xs text-muted-foreground">
                          {trip.destination}
                        </p>

                        <h3 className="mt-2 text-base font-bold transition group-hover:text-primary md:text-lg">
                          {trip.title}
                        </h3>

                        {trip.duration && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            المدة: {trip.duration}
                          </p>
                        )}

                        {price !== null && (
                          <p className="mt-3 font-bold text-primary">
                            {price} دج
                          </p>
                        )}
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages >= 1 && (
              <nav
                aria-label="التنقل بين الصفحات"
                className="mt-14 flex flex-wrap items-center justify-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="inline-flex h-11 items-center gap-2 border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-inherit"
                >
                  <ArrowRight className="h-4 w-4" />
                  السابق
                </button>

                {getPageNumbers(pagination.page, pagination.totalPages).map(
                  (item, index) =>
                    item === "..." ? (
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
                          item === pagination.page ? "page" : undefined
                        }
                        className={`h-11 min-w-11 border px-3 text-sm font-semibold transition ${
                          item === pagination.page
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:border-primary hover:text-primary"
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
                  التالي
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}