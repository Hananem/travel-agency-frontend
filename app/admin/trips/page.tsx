'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
  X,
  Search,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Globe,
  FileText,
  Plus,
} from 'lucide-react';
import {
  tripsService,
  type Trip,
  type TripsResponse,
} from '@/services/trips.service';

const PER_PAGE = 5;

export default function TripsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('الكل');
  const [destination, setDestination] = useState('الكل');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusId, setStatusId] = useState<string | null>(null);

  const {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<TripsResponse>({
    queryKey: ['trips'],
    queryFn: tripsService.getTrips,
  });

  const trips = result?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tripsService.deleteTrip(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      setDeleteId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      isPublished,
    }: {
      id: string;
      isPublished: boolean;
    }) => tripsService.updateTripStatus(id, isPublished),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      setStatusId(null);
    },
  });

  const destinations = useMemo(
    () => [...new Set(trips.map((trip) => trip.destination))],
    [trips],
  );

  const filtered = useMemo(
    () =>
      trips.filter((trip) => {
        const matchesSearch = `${trip.title} ${trip.destination}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());

        const tripStatus = trip.isPublished ? 'منشورة' : 'مسودة';

        return (
          matchesSearch &&
          (status === 'الكل' || tripStatus === status) &&
          (destination === 'الكل' || trip.destination === destination)
        );
      }),
    [trips, search, status, destination],
  );

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, Math.max(pages, 1));

  const rows = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const selectedTrip = trips.find((trip) => trip.id === deleteId);
  const selectedStatusTrip = trips.find((trip) => trip.id === statusId);

  function confirmDelete() {
    if (deleteId === null || deleteMutation.isPending) return;
    deleteMutation.mutate(deleteId);
  }

  function confirmStatusChange() {
    if (selectedStatusTrip === undefined || statusMutation.isPending) return;

    statusMutation.mutate({
      id: selectedStatusTrip.id,
      isPublished: !selectedStatusTrip.isPublished,
    });
  }

  function openStatusModal(id: string) {
    statusMutation.reset();
    setStatusId(id);
  }

  return (
    <main dir="rtl" className="space-y-12 text-foreground">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-sm font-semibold text-primary">
            لوحة الإدارة
          </span>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            الرحلات
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
            إدارة الرحلات السياحية والعروض.
          </p>
        </div>

        <Link
          href="/admin/trips/new"
          className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90"
        >
          <Plus size={18} />
          إضافة رحلة
        </Link>
      </header>

      {isLoading && (
        <div className="border-y border-border py-16 text-center text-muted-foreground">
          جارٍ تحميل الرحلات...
        </div>
      )}

      {isError && (
        <div className="space-y-4 border-y border-border py-10 text-center">
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'تعذر جلب الرحلات.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          {/* Stats */}
          <section className="grid gap-x-8 gap-y-8 sm:grid-cols-3">
            <Stat title="إجمالي الرحلات" value={trips.length} />
            <Stat
              title="الرحلات المنشورة"
              value={trips.filter((trip) => trip.isPublished).length}
            />
            <Stat
              title="المسودات"
              value={trips.filter((trip) => !trip.isPublished).length}
            />
          </section>

          {/* Filters */}
          <section className="grid gap-4 border-y border-border py-6 md:grid-cols-3">
            <div className="relative">
              <Search
                className="absolute right-3 top-3.5 text-muted-foreground"
                size={18}
              />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="البحث عن رحلة..."
                className="w-full border border-border bg-white py-3 pr-10 pl-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="الكل">جميع الحالات</option>
              <option value="منشورة">منشورة</option>
              <option value="مسودة">مسودة</option>
            </select>

            <select
              value={destination}
              onChange={(e) => {
                setDestination(e.target.value);
                setPage(1);
              }}
              className="border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="الكل">جميع الوجهات</option>
              {destinations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <p className="text-sm text-muted-foreground md:col-span-3">
              عدد النتائج:{' '}
              <span className="font-bold text-foreground">
                {filtered.length}
              </span>
            </p>
          </section>

          {/* Table */}
          <section className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-xs font-bold text-muted-foreground">
                  <th className="px-4 py-4">اسم الرحلة</th>
                  <th className="px-4 py-4">الوجهة</th>
                  <th className="px-4 py-4">السعر</th>
                  <th className="px-4 py-4">المدة</th>
                  <th className="px-4 py-4">الحالة</th>
                  <th className="px-4 py-4">الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((trip) => (
                  <tr
                    key={trip.id}
                    className="border-b border-border transition hover:bg-muted"
                  >
                    <td className="px-4 py-5 font-bold">{trip.title}</td>
                    <td className="px-4 py-5 text-muted-foreground">
                      {trip.destination}
                    </td>
                    <td className="whitespace-nowrap px-4 py-5">
                      {trip.price}
                    </td>
                    <td className="whitespace-nowrap px-4 py-5 text-muted-foreground">
                      {trip.duration}
                    </td>
                    <td className="px-4 py-5">
                      <StatusBadge isPublished={trip.isPublished} />
                    </td>
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/trips/${trip.id}/edit`}
                          aria-label="تعديل الرحلة"
                          title="تعديل"
                          className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Pencil size={17} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openStatusModal(trip.id)}
                          aria-label="تغيير حالة الرحلة"
                          title="تغيير الحالة"
                          className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <RefreshCw size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteId(trip.id)}
                          aria-label="حذف الرحلة"
                          title="حذف"
                          className="flex h-10 w-10 items-center justify-center border border-border text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      لا توجد رحلات مطابقة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <Pagination page={currentPage} pages={pages} onChange={setPage} />
        </>
      )}

      {statusId !== null && selectedStatusTrip && (
        <StatusModal
          trip={selectedStatusTrip}
          isSaving={statusMutation.isPending}
          error={
            statusMutation.isError
              ? statusMutation.error instanceof Error
                ? statusMutation.error.message
                : 'تعذر تغيير حالة الرحلة.'
              : ''
          }
          onCancel={() => {
            if (!statusMutation.isPending) setStatusId(null);
          }}
          onConfirm={confirmStatusChange}
        />
      )}

      {deleteId !== null && (
        <DeleteModal
          title="حذف الرحلة"
          message={`هل أنتِ متأكدة من حذف «${selectedTrip?.title ?? ''}»؟ لا يمكن التراجع عن هذا الإجراء.`}
          isDeleting={deleteMutation.isPending}
          error={
            deleteMutation.isError
              ? deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : 'تعذر حذف الرحلة.'
              : ''
          }
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}
    </main>
  );
}

function StatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-bold ${
        isPublished
          ? 'bg-green-100 text-green-800'
          : 'bg-amber-100 text-amber-800'
      }`}
    >
      {isPublished ? 'منشورة' : 'مسودة'}
    </span>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="border-b border-border pb-5">
      <p className="text-4xl font-extrabold tracking-tight md:text-5xl">
        {value}
      </p>
      <h3 className="mt-2 text-sm font-bold md:text-base">{title}</h3>
    </div>
  );
}

function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        الصفحة <span className="font-bold text-foreground">{page}</span> من{' '}
        {pages}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="flex h-10 items-center gap-1 border border-border px-4 text-sm transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight size={16} /> السابقة
        </button>

        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <button
            type="button"
            key={p}
            onClick={() => onChange(p)}
            className={`h-10 min-w-10 border px-3 text-sm transition ${
              page === p
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary hover:text-primary'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          type="button"
          disabled={page === pages}
          onClick={() => onChange(page + 1)}
          className="flex h-10 items-center gap-1 border border-border px-4 text-sm transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          التالية <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}

function StatusModal({
  trip,
  isSaving,
  error,
  onCancel,
  onConfirm,
}: {
  trip: Trip;
  isSaving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isPublished = trip.isPublished;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isSaving) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
        className="w-full max-w-md bg-white p-8 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center border border-primary/40 text-primary">
            {isPublished ? <FileText size={21} /> : <Globe size={21} />}
          </span>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="status-modal-title"
          className="mt-6 text-xl font-extrabold tracking-tight"
        >
          {isPublished ? 'تحويل الرحلة إلى مسودة' : 'نشر الرحلة'}
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {isPublished
            ? `هل تريد إلغاء نشر رحلة «${trip.title}»؟ لن تظهر للزوار بعد تحويلها إلى مسودة.`
            : `هل تريد نشر رحلة «${trip.title}»؟ ستصبح متاحة للزوار بعد النشر.`}
        </p>

        <div className="mt-5 flex items-center gap-3 border-y border-border py-3 text-sm">
          <span className="text-muted-foreground">الحالة الحالية:</span>
          <StatusBadge isPublished={isPublished} />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-start gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving
              ? 'جارٍ تغيير الحالة...'
              : isPublished
                ? 'نعم، حوّل إلى مسودة'
                : 'نعم، انشر الرحلة'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            إلغاء
          </button>
        </div>
      </section>
    </div>
  );
}

function DeleteModal({
  title,
  message,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  isDeleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        className="w-full max-w-md bg-white p-8 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center border border-red-600/40 text-red-600">
            <Trash2 size={21} />
          </span>

          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="delete-modal-title"
          className="mt-6 text-xl font-extrabold tracking-tight"
        >
          {title}
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {message}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-start gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting ? 'جارٍ الحذف...' : 'نعم، احذف'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            إلغاء
          </button>
        </div>
      </section>
    </div>
  );
}