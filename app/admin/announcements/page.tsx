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
  Megaphone,
  Plus,
} from 'lucide-react';
import { announcementsService } from '@/services/announcements.service';

type Announcement = {
  id: string;
  title: string;
  content: string;
  type: string;
  imageUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const PER_PAGE = 5;

const typeLabels: Record<string, string> = {
  news: 'خبر',
  offer: 'عرض سياحي',
  alert: 'تنبيه',
  announcement: 'تنبيه',
};

function getTypeLabel(type: string) {
  return typeLabels[type] ?? type;
}

function formatDate(date: string | null) {
  if (!date) return '—';

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '—';

  return new Intl.DateTimeFormat('ar-DZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsedDate);
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [type, setType] = useState('الكل');
  const [status, setStatus] = useState('الكل');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusId, setStatusId] = useState<string | null>(null);

  const {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['announcements'],
    queryFn: () => announcementsService.getAnnouncements(),
  });

  const items: Announcement[] = result?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => announcementsService.deleteAnnouncement(id),
    onSuccess: async () => {
      setDeleteId(null);
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      isPublished,
    }: {
      id: string;
      isPublished: boolean;
    }) => announcementsService.updateAnnouncementStatus(id, isPublished),

    onSuccess: async () => {
      setStatusId(null);
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });

  const types = useMemo(
    () => [...new Set(items.map((item) => item.type))],
    [items],
  );

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        `${item.title} ${item.content} ${getTypeLabel(item.type)}`
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesType = type === 'الكل' || item.type === type;

      const matchesStatus =
        status === 'الكل' ||
        (status === 'منشور' && item.isPublished) ||
        (status === 'مسودة' && !item.isPublished);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [items, search, type, status]);

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, Math.max(pages, 1));
  const rows = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const publishedCount = items.filter((item) => item.isPublished).length;

  const selectedAnnouncement =
    items.find((item) => item.id === statusId) ?? null;
  const deleteAnnouncement = items.find((item) => item.id === deleteId);

  function resetFilters() {
    setSearch('');
    setType('الكل');
    setStatus('الكل');
    setPage(1);
  }

  function confirmDelete() {
    if (deleteId === null || deleteMutation.isPending) return;
    deleteMutation.mutate(deleteId);
  }

  function confirmStatusChange() {
    if (!selectedAnnouncement || statusMutation.isPending) return;

    statusMutation.mutate({
      id: selectedAnnouncement.id,
      isPublished: !selectedAnnouncement.isPublished,
    });
  }

  function openStatusModal(id: string) {
    statusMutation.reset();
    setStatusId(id);
  }

  function closeStatusModal() {
    if (statusMutation.isPending) return;
    setStatusId(null);
    statusMutation.reset();
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
            الإعلانات والأخبار
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
            إدارة أخبار الوكالة والعروض والتنبيهات.
          </p>
        </div>

        <Link
          href="/admin/announcements/new"
          className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90"
        >
          <Plus size={18} />
          إضافة إعلان
        </Link>
      </header>

      {isLoading && (
        <div className="border-y border-border py-16 text-center text-muted-foreground">
          جارٍ تحميل الإعلانات...
        </div>
      )}

      {isError && (
        <div className="space-y-4 border-y border-border py-10 text-center">
          <p className="text-red-600">
            {error instanceof Error ? error.message : 'حدث خطأ غير متوقع.'}
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
            <Stat title="جميع الإعلانات" value={items.length} />
            <Stat title="منشورة" value={publishedCount} />
            <Stat title="مسودات" value={items.length - publishedCount} />
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
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="البحث عن إعلان..."
                className="w-full border border-border bg-white py-3 pr-10 pl-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="الكل">جميع الأنواع</option>
              {types.map((item) => (
                <option key={item} value={item}>
                  {getTypeLabel(item)}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="الكل">جميع الحالات</option>
              <option value="منشور">منشور</option>
              <option value="مسودة">مسودة</option>
            </select>

            <div className="flex items-center justify-between text-sm text-muted-foreground md:col-span-3">
              <span>
                عدد النتائج:{' '}
                <span className="font-bold text-foreground">
                  {filtered.length}
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

          {/* Table */}
          <section className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b-2 border-foreground text-xs font-bold text-muted-foreground">
                  <th className="px-4 py-4">العنوان</th>
                  <th className="px-4 py-4">النوع</th>
                  <th className="px-4 py-4">التاريخ</th>
                  <th className="px-4 py-4">الحالة</th>
                  <th className="px-4 py-4">الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border transition hover:bg-muted"
                  >
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-12 w-12 shrink-0 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary/10 text-primary">
                            <Megaphone size={18} />
                          </div>
                        )}

                        <span className="line-clamp-2 font-bold">
                          {item.title}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-5">
                      <span className="inline-block border border-primary/40 px-3 py-1 text-xs font-semibold text-primary">
                        {getTypeLabel(item.type)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-5 text-muted-foreground">
                      {formatDate(item.publishedAt ?? item.createdAt)}
                    </td>

                    <td className="px-4 py-5">
                      <StatusBadge isPublished={item.isPublished} />
                    </td>

                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/announcements/${item.id}/edit`}
                          aria-label="تعديل الإعلان"
                          title="تعديل"
                          className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Pencil size={17} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => openStatusModal(item.id)}
                          disabled={statusMutation.isPending}
                          aria-label={
                            item.isPublished
                              ? 'تحويل إلى مسودة'
                              : 'نشر الإعلان'
                          }
                          title={
                            item.isPublished
                              ? 'تحويل إلى مسودة'
                              : 'نشر الإعلان'
                          }
                          className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
                        >
                          <RefreshCw size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
                          aria-label="حذف الإعلان"
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
                      colSpan={5}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      لا توجد إعلانات مطابقة.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <Pagination page={currentPage} pages={pages} onChange={setPage} />
        </>
      )}

      {deleteId !== null && (
        <DeleteModal
          title="حذف الإعلان"
          message={`هل أنتِ متأكدة من حذف «${
            deleteAnnouncement?.title ?? ''
          }»؟ لا يمكن التراجع عن هذا الإجراء.`}
          isDeleting={deleteMutation.isPending}
          error={
            deleteMutation.isError
              ? 'تعذر حذف الإعلان. تحققي من اتصال الخادم ثم حاولي مجددًا.'
              : ''
          }
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}

      {selectedAnnouncement && (
        <StatusModal
          announcement={selectedAnnouncement}
          isSaving={statusMutation.isPending}
          error={
            statusMutation.isError
              ? statusMutation.error instanceof Error
                ? statusMutation.error.message
                : 'تعذر تغيير حالة الإعلان. تحققي من اتصال الخادم ثم حاولي مجددًا.'
              : ''
          }
          onCancel={closeStatusModal}
          onConfirm={confirmStatusChange}
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
      {isPublished ? 'منشور' : 'مسودة'}
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

        {Array.from({ length: pages }, (_, index) => index + 1).map((item) => (
          <button
            type="button"
            key={item}
            onClick={() => onChange(item)}
            className={`h-10 min-w-10 border px-3 text-sm transition ${
              page === item
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border hover:border-primary hover:text-primary'
            }`}
          >
            {item}
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
  announcement,
  isSaving,
  error,
  onCancel,
  onConfirm,
}: {
  announcement: Announcement;
  isSaving: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const isPublished = announcement.isPublished;
  const willPublish = !isPublished;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onCancel();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-status-title"
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
          id="announcement-status-title"
          className="mt-6 text-xl font-extrabold tracking-tight"
        >
          {isPublished ? 'تحويل الإعلان إلى مسودة' : 'نشر الإعلان'}
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {isPublished
            ? `هل تريدين تحويل «${announcement.title}» إلى مسودة؟ لن يظهر للزوار بعد ذلك.`
            : `هل تريدين نشر «${announcement.title}»؟ سيصبح متاحًا للزوار بعد النشر.`}
        </p>

        <div className="mt-5 border-y border-border py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">الحالة الحالية</span>
            <StatusBadge isPublished={isPublished} />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-muted-foreground">الحالة الجديدة</span>
            <StatusBadge isPublished={willPublish} />
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm leading-6 text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-start gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSaving}
            className="inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                جارٍ الحفظ...
              </>
            ) : isPublished ? (
              'تحويل إلى مسودة'
            ) : (
              'نشر الإعلان'
            )}
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
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) onCancel();
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