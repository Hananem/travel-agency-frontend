'use client';

import { ReactNode, useEffect, useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Ban,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import {
  bookingsService,
  type BookingStatus,
} from '@/services/bookings.service';

type Booking = {
  id: string;
  tripId: string;
  fullName: string;
  phone: string;
  companionsCount: number;
  note: string | null;
  adminNote: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  trip: {
    id: string;
    title: string;
    slug: string;
    destination: string;
    price: string | number;
    duration: string;
  };
};

type BookingsResponse = {
  data: Booking[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

const PER_PAGE = 10;

const STATUS_LABELS: Record<BookingStatus, string> = {
  PENDING: 'قيد الانتظار',
  CONFIRMED: 'مؤكد',
  CANCELLED: 'ملغي',
};

const STATUS_STYLES: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

function formatDate(value: string): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function useStatusCount(status?: BookingStatus) {
  return useQuery({
    queryKey: ['bookings', 'count', status ?? 'all'],
    queryFn: async () => {
      const response = (await bookingsService.getBookings({
        page: 1,
        limit: 1,
        status,
      })) as BookingsResponse;

      return response.pagination?.total ?? 0;
    },
  });
}

export default function BookingsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>(
    'all',
  );
  const [page, setPage] = useState(1);

  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [statusAction, setStatusAction] = useState<{
    booking: Booking;
    status: BookingStatus;
  } | null>(null);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const {
    data: response,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['bookings', 'list', page, debouncedSearch, statusFilter],
    queryFn: () =>
      bookingsService.getBookings({
        page,
        limit: PER_PAGE,
        search: debouncedSearch,
        status: statusFilter === 'all' ? undefined : statusFilter,
      }) as Promise<BookingsResponse>,
    placeholderData: keepPreviousData,
  });

  const bookings = response?.data ?? [];
  const pagination = response?.pagination;

  const totalCount = useStatusCount();
  const pendingCount = useStatusCount('PENDING');
  const confirmedCount = useStatusCount('CONFIRMED');
  const cancelledCount = useStatusCount('CANCELLED');

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { status?: BookingStatus; adminNote?: string };
    }) => bookingsService.updateBooking(id, data),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setStatusAction(null);
      setDetailsBooking((previous) =>
        previous ? (updated as Booking) : null,
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bookingsService.deleteBooking(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setDeletingBooking(null);
    },
  });

  function openStatusModal(booking: Booking, status: BookingStatus) {
    updateMutation.reset();
    setDetailsBooking(null);
    setStatusAction({ booking, status });
  }

  function resetFilters() {
    setSearch('');
    setStatusFilter('all');
    setPage(1);
  }

  return (
    <main dir="rtl" className="space-y-12 text-foreground">
      {/* Header */}
      <header>
        <span className="text-sm font-semibold text-primary">لوحة الإدارة</span>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          الحجوزات
        </h1>

        <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
          متابعة طلبات الحجز وتأكيدها أو إلغائها وإضافة ملاحظاتك عليها.
        </p>
      </header>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-4">
        <Stat label="إجمالي الحجوزات" value={totalCount.data ?? 0} />
        <Stat label="قيد الانتظار" value={pendingCount.data ?? 0} />
        <Stat label="المؤكدة" value={confirmedCount.data ?? 0} />
        <Stat label="الملغاة" value={cancelledCount.data ?? 0} />
      </section>

      {/* Filters */}
      <section className="grid gap-4 border-y border-border py-6 md:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث باسم الحاجز أو رقم الهاتف..."
            className="w-full border border-border bg-white py-3 pl-4 pr-10 text-sm outline-none transition focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as 'all' | BookingStatus)
          }
          className="border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
        >
          <option value="all">كل الحالات</option>
          <option value="PENDING">قيد الانتظار</option>
          <option value="CONFIRMED">المؤكدة</option>
          <option value="CANCELLED">الملغاة</option>
        </select>

        <button
          type="button"
          onClick={() => {
            void refetch();
            void queryClient.invalidateQueries({ queryKey: ['bookings'] });
          }}
          disabled={isFetching}
          className="inline-flex items-center justify-center gap-2 border border-border px-5 py-3 text-sm font-semibold transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          <RefreshCw size={16} className={isFetching ? 'animate-spin' : ''} />
          تحديث
        </button>

        <div className="flex items-center justify-between text-sm text-muted-foreground md:col-span-3">
          <span>
            عدد النتائج:{' '}
            <span className="font-bold text-foreground">
              {pagination?.total ?? 0}
            </span>
          </span>
          <button
            type="button"
            onClick={resetFilters}
            className="font-semibold underline underline-offset-4 transition hover:text-primary"
          >
            إعادة ضبط الفلاتر
          </button>
        </div>
      </section>

      {/* Content */}
      <section>
        {isLoading ? (
          <div className="border-b border-border py-16 text-center text-sm text-muted-foreground">
            جارٍ تحميل الحجوزات...
          </div>
        ) : isError ? (
          <div className="space-y-4 border-b border-border py-10 text-center">
            <p className="text-sm text-red-600">{getErrorMessage(error)}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : bookings.length === 0 ? (
          <div className="border-b border-border py-16 text-center">
            <ClipboardList size={32} className="mx-auto text-primary" />
            <h2 className="mt-4 text-lg font-bold">لا توجد حجوزات</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {debouncedSearch || statusFilter !== 'all'
                ? 'لم نعثر على نتائج مطابقة للبحث.'
                : 'ستظهر هنا الحجوزات عند وصولها من الزوار.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-right text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground text-xs font-bold text-muted-foreground">
                    <th className="px-4 py-4">الحاجز</th>
                    <th className="px-4 py-4">الهاتف</th>
                    <th className="px-4 py-4">عدد المرافقين</th>
                    <th className="px-4 py-4">الرحلة</th>
                    <th className="px-4 py-4">الحالة</th>
                    <th className="px-4 py-4">تاريخ الحجز</th>
                    <th className="px-4 py-4">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className="border-b border-border transition hover:bg-muted"
                    >
                      <td className="px-4 py-5">
                        <p className="font-bold">{booking.fullName}</p>
                        {booking.adminNote && (
                          <p className="mt-1 max-w-48 truncate text-xs text-muted-foreground">
                            ملاحظتك: {booking.adminNote}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-5">
                        <a
                          href={`tel:${booking.phone}`}
                          dir="ltr"
                          className="inline-block tabular-nums transition hover:text-primary"
                        >
                          {booking.phone}
                        </a>
                      </td>

                      <td className="px-4 py-5 tabular-nums">
                        {booking.companionsCount}
                        <span className="mr-2 text-xs text-muted-foreground">
                          (المجموع {booking.companionsCount + 1})
                        </span>
                      </td>

                      <td className="px-4 py-5">
                        <p className="font-bold">{booking.trip?.title ?? '-'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {booking.trip?.destination ?? ''}
                        </p>
                      </td>

                      <td className="px-4 py-5">
                        <StatusBadge status={booking.status} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-5 text-muted-foreground">
                        {formatDate(booking.createdAt)}
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <IconButton
                            title="عرض التفاصيل"
                            onClick={() => {
                              updateMutation.reset();
                              setDetailsBooking(booking);
                            }}
                          >
                            <Eye size={16} />
                          </IconButton>

                          <IconButton
                            title="تأكيد الحجز"
                            disabled={booking.status === 'CONFIRMED'}
                            onClick={() => openStatusModal(booking, 'CONFIRMED')}
                          >
                            <Check size={16} />
                          </IconButton>

                          <IconButton
                            title="إلغاء الحجز"
                            disabled={booking.status === 'CANCELLED'}
                            onClick={() => openStatusModal(booking, 'CANCELLED')}
                          >
                            <Ban size={16} />
                          </IconButton>

                          <button
                            type="button"
                            title="حذف الحجز"
                            aria-label="حذف الحجز"
                            onClick={() => {
                              deleteMutation.reset();
                              setDeletingBooking(booking);
                            }}
                            className="flex h-10 w-10 items-center justify-center border border-border text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && (
              <Pagination
                currentPage={pagination.page}
                totalPages={Math.max(1, pagination.totalPages)}
                totalItems={pagination.total}
                perPage={PER_PAGE}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </section>

      {detailsBooking && (
        <BookingDetailsModal
          booking={detailsBooking}
          isSaving={updateMutation.isPending}
          error={
            updateMutation.isError ? getErrorMessage(updateMutation.error) : ''
          }
          onClose={() => {
            if (!updateMutation.isPending) {
              setDetailsBooking(null);
              updateMutation.reset();
            }
          }}
          onSaveNote={(adminNote) =>
            updateMutation.mutate({
              id: detailsBooking.id,
              data: { adminNote },
            })
          }
          onChangeStatus={(status) => openStatusModal(detailsBooking, status)}
        />
      )}

      {statusAction && (
        <StatusModal
          booking={statusAction.booking}
          status={statusAction.status}
          isSaving={updateMutation.isPending}
          error={
            updateMutation.isError ? getErrorMessage(updateMutation.error) : ''
          }
          onClose={() => {
            if (!updateMutation.isPending) {
              setStatusAction(null);
              updateMutation.reset();
            }
          }}
          onConfirm={(adminNote) =>
            updateMutation.mutate({
              id: statusAction.booking.id,
              data: { status: statusAction.status, adminNote },
            })
          }
        />
      )}

      {deletingBooking && (
        <DeleteModal
          name={deletingBooking.fullName}
          isDeleting={deleteMutation.isPending}
          error={
            deleteMutation.isError ? getErrorMessage(deleteMutation.error) : ''
          }
          onClose={() => {
            if (!deleteMutation.isPending) {
              setDeletingBooking(null);
            }
          }}
          onConfirm={() => deleteMutation.mutate(deletingBooking.id)}
        />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border-b border-border pb-5">
      <p className="text-4xl font-extrabold tracking-tight tabular-nums md:text-5xl">
        {value}
      </p>
      <h3 className="mt-2 text-sm font-bold md:text-base">{label}</h3>
    </div>
  );
}

function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function IconButton({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  perPage,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  onPageChange: (page: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const end = Math.min(currentPage * perPage, totalItems);

  return (
    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        عرض{' '}
        <span className="font-bold text-foreground">
          {start}–{end}
        </span>{' '}
        من أصل {totalItems}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="flex h-10 items-center gap-1 border border-border px-4 text-sm transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          <ChevronRight size={16} /> السابق
        </button>

        <span className="min-w-24 text-center text-sm text-muted-foreground">
          صفحة{' '}
          <span className="font-bold text-foreground">{currentPage}</span> من{' '}
          {totalPages}
        </span>

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="flex h-10 items-center gap-1 border border-border px-4 text-sm transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-40"
        >
          التالي <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  );
}

function ModalShell({
  titleId,
  maxWidth = 'max-w-md',
  busy,
  onClose,
  children,
}: {
  titleId: string;
  maxWidth?: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`my-3 w-full ${maxWidth} bg-white shadow-xl`}
      >
        {children}
      </section>
    </div>
  );
}

function CloseButton({
  onClose,
  disabled,
}: {
  onClose: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClose}
      disabled={disabled}
      aria-label="إغلاق"
      className="flex h-10 w-10 shrink-0 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
    >
      <X size={20} />
    </button>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-border pb-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm font-bold">{children}</div>
    </div>
  );
}

function BookingDetailsModal({
  booking,
  isSaving,
  error,
  onClose,
  onSaveNote,
  onChangeStatus,
}: {
  booking: Booking;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSaveNote: (note: string) => void;
  onChangeStatus: (status: BookingStatus) => void;
}) {
  const [adminNote, setAdminNote] = useState(booking.adminNote ?? '');
  const noteChanged = adminNote.trim() !== (booking.adminNote ?? '').trim();

  return (
    <ModalShell
      titleId="booking-details-title"
      maxWidth="max-w-2xl"
      busy={isSaving}
      onClose={onClose}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-6 sm:px-8">
        <div>
          <span className="text-sm font-semibold text-primary">
            تفاصيل الحجز
          </span>
          <h2
            id="booking-details-title"
            className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl"
          >
            {booking.fullName}
          </h2>
          <div className="mt-2">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <CloseButton onClose={onClose} disabled={isSaving} />
      </div>

      <div className="max-h-[calc(100dvh-260px)] space-y-6 overflow-y-auto p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <InfoRow label="الاسم">{booking.fullName}</InfoRow>

          <InfoRow label="رقم الهاتف">
            <a
              href={`tel:${booking.phone}`}
              dir="ltr"
              className="inline-block tabular-nums hover:text-primary"
            >
              {booking.phone}
            </a>
          </InfoRow>

          <InfoRow label="عدد المرافقين">{booking.companionsCount}</InfoRow>

          <InfoRow label="إجمالي الأشخاص">
            {booking.companionsCount + 1}
          </InfoRow>

          <InfoRow label="الرحلة">{booking.trip?.title ?? '-'}</InfoRow>

          <InfoRow label="الوجهة">{booking.trip?.destination ?? '-'}</InfoRow>

          <InfoRow label="سعر الرحلة">
            {booking.trip?.price != null ? `${booking.trip.price} دج` : '-'}
          </InfoRow>

          <InfoRow label="مدة الرحلة">{booking.trip?.duration ?? '-'}</InfoRow>

          <InfoRow label="تاريخ الحجز">{formatDate(booking.createdAt)}</InfoRow>
        </div>

        <div>
          <p className="mb-1.5 text-sm font-bold">ملاحظة الحاجز</p>
          <p className="whitespace-pre-wrap border border-border bg-muted p-3 text-sm leading-7">
            {booking.note || 'لا توجد ملاحظة.'}
          </p>
        </div>

        <div>
          <label htmlFor="admin-note" className="mb-1.5 block text-sm font-bold">
            ملاحظتك (للإدارة فقط)
          </label>
          <textarea
            id="admin-note"
            rows={3}
            maxLength={1000}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            placeholder="مثال: تم الاتصال به، سيدفع عند الوصول..."
            disabled={isSaving}
            className="w-full resize-y border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-muted"
          />
          <button
            type="button"
            onClick={() => onSaveNote(adminNote)}
            disabled={isSaving || !noteChanged}
            className="mt-2 inline-flex items-center gap-2 border border-border px-5 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {isSaving && <RefreshCw size={14} className="animate-spin" />}
            حفظ الملاحظة
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="border border-red-600/40 p-3 text-sm text-red-600"
          >
            {error}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border px-6 py-5 sm:flex-row sm:px-8">
        <button
          type="button"
          onClick={() => onChangeStatus('CONFIRMED')}
          disabled={isSaving || booking.status === 'CONFIRMED'}
          className="inline-flex items-center justify-center gap-2 bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Check size={16} />
          تأكيد الحجز
        </button>

        <button
          type="button"
          onClick={() => onChangeStatus('CANCELLED')}
          disabled={isSaving || booking.status === 'CANCELLED'}
          className="inline-flex items-center justify-center gap-2 border border-border px-7 py-3 text-sm font-semibold text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Ban size={16} />
          إلغاء الحجز
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={isSaving}
          className="border border-border px-7 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-50"
        >
          إغلاق
        </button>
      </div>
    </ModalShell>
  );
}

function StatusModal({
  booking,
  status,
  isSaving,
  error,
  onClose,
  onConfirm,
}: {
  booking: Booking;
  status: BookingStatus;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (adminNote: string) => void;
}) {
  const [adminNote, setAdminNote] = useState(booking.adminNote ?? '');
  const isConfirm = status === 'CONFIRMED';

  return (
    <ModalShell titleId="booking-status-title" busy={isSaving} onClose={onClose}>
      <div className="p-8">
        <div className="flex items-start justify-between gap-4">
          <span
            className={`flex h-12 w-12 items-center justify-center border ${
              isConfirm
                ? 'border-primary/40 text-primary'
                : 'border-red-600/40 text-red-600'
            }`}
          >
            {isConfirm ? <Check size={21} /> : <Ban size={21} />}
          </span>

          <CloseButton onClose={onClose} disabled={isSaving} />
        </div>

        <h2
          id="booking-status-title"
          className="mt-6 text-xl font-extrabold tracking-tight"
        >
          {isConfirm ? 'تأكيد الحجز' : 'إلغاء الحجز'}
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {isConfirm
            ? `هل تريد تأكيد حجز «${booking.fullName}» في رحلة «${booking.trip?.title}»؟`
            : `هل تريد إلغاء حجز «${booking.fullName}» في رحلة «${booking.trip?.title}»؟`}
        </p>

        <div className="mt-5">
          <label
            htmlFor="status-admin-note"
            className="mb-1.5 block text-sm font-bold"
          >
            ملاحظة (اختياري)
          </label>
          <textarea
            id="status-admin-note"
            rows={3}
            maxLength={1000}
            value={adminNote}
            onChange={(event) => setAdminNote(event.target.value)}
            disabled={isSaving}
            className="w-full resize-y border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-muted"
          />
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm leading-6 text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-start gap-3">
          <button
            type="button"
            onClick={() => onConfirm(adminNote)}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition disabled:opacity-60 ${
              isConfirm
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {isSaving && <RefreshCw size={16} className="animate-spin" />}
            {isSaving
              ? 'جارٍ الحفظ...'
              : isConfirm
                ? 'تأكيد الحجز'
                : 'إلغاء الحجز'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            رجوع
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function DeleteModal({
  name,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: {
  name: string;
  isDeleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell
      titleId="delete-booking-title"
      busy={isDeleting}
      onClose={onClose}
    >
      <div className="p-8">
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center border border-red-600/40 text-red-600">
            <Trash2 size={21} />
          </span>

          <CloseButton onClose={onClose} disabled={isDeleting} />
        </div>

        <h2
          id="delete-booking-title"
          className="mt-6 text-xl font-extrabold tracking-tight"
        >
          حذف الحجز
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          هل أنت متأكد من حذف حجز{' '}
          <span className="font-bold text-foreground">{name}</span>؟ لا يمكن
          التراجع عن هذا الإجراء.
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
            className="inline-flex items-center gap-2 bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isDeleting && <RefreshCw size={16} className="animate-spin" />}
            {isDeleting ? 'جارٍ الحذف...' : 'تأكيد الحذف'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            إلغاء
          </button>
        </div>
      </div>
    </ModalShell>
  );
}