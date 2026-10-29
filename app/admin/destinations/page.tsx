'use client';

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  ImagePlus,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Upload,
  MapPin,
  RefreshCw,
  Globe,
  FileText,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

import { destinationsService } from '@/services/destinations.service';

type Destination = {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  imageUrl: string | null;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type DestinationsResponse = Destination[] | { data?: Destination[] };

type DestinationFormData = {
  name: string;
  slug: string;
  country: string;
  description: string;
  imageUrl: string;
  isPublished: boolean;
  sortOrder: number;
};

const PER_PAGE = 5;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع. حاول مرة أخرى.';
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function formatDate(value: string): string {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return new Intl.DateTimeFormat('ar-DZ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

async function uploadDestinationImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);

  const response = await fetch('http://localhost:3000/uploads', {
    method: 'POST',
    body,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || 'تعذر رفع الصورة. حاول مرة أخرى.');
  }

  const imageUrl = result?.url ?? result?.imageUrl;

  if (typeof imageUrl !== 'string' || !imageUrl.trim()) {
    throw new Error('تم إرسال الصورة، لكن لم يُرجع الخادم رابط الصورة.');
  }

  return imageUrl;
}

export default function DestinationsPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [publicationFilter, setPublicationFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDestination, setEditingDestination] =
    useState<Destination | null>(null);
  const [deletingDestination, setDeletingDestination] =
    useState<Destination | null>(null);
  const [changingStatusDestination, setChangingStatusDestination] =
    useState<Destination | null>(null);
  const [formError, setFormError] = useState('');

  const {
    data: destinationsResponse,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<DestinationsResponse>({
    queryKey: ['destinations'],
    queryFn: async () =>
      (await destinationsService.getDestinations()) as DestinationsResponse,
  });

  const destinations: Destination[] = Array.isArray(destinationsResponse)
    ? destinationsResponse
    : (destinationsResponse?.data ?? []);

  const saveMutation = useMutation({
    mutationFn: (data: DestinationFormData) => {
      if (editingDestination) {
        return destinationsService.updateDestination(
          editingDestination.id,
          data,
        );
      }

      return destinationsService.createDestination(data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['destinations'] });
      setIsFormOpen(false);
      setEditingDestination(null);
      setFormError('');
    },
    onError: (mutationError: unknown) => {
      setFormError(getErrorMessage(mutationError));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => destinationsService.deleteDestination(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['destinations'] });
      setDeletingDestination(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      isPublished,
    }: {
      id: string;
      isPublished: boolean;
    }) => destinationsService.updateDestinationStatus(id, isPublished),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['destinations'] });
      setChangingStatusDestination(null);
    },
  });

  const filteredDestinations = destinations.filter((destination) => {
    const searchValue = search.trim().toLowerCase();

    const matchesSearch =
      !searchValue ||
      destination.name.toLowerCase().includes(searchValue) ||
      destination.country.toLowerCase().includes(searchValue) ||
      destination.slug.toLowerCase().includes(searchValue);

    const matchesPublication =
      publicationFilter === 'all' ||
      (publicationFilter === 'published' && destination.isPublished) ||
      (publicationFilter === 'draft' && !destination.isPublished);

    return matchesSearch && matchesPublication;
  });

  const totalPages = Math.max(
    1,
    Math.ceil(filteredDestinations.length / PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);

  const paginatedDestinations = filteredDestinations.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, publicationFilter]);

  function openCreateModal() {
    setEditingDestination(null);
    setFormError('');
    setIsFormOpen(true);
  }

  function openEditModal(destination: Destination) {
    setEditingDestination(destination);
    setFormError('');
    setIsFormOpen(true);
  }

  function closeForm() {
    if (saveMutation.isPending) return;
    setIsFormOpen(false);
    setEditingDestination(null);
    setFormError('');
  }

  function handleSave(data: DestinationFormData) {
    setFormError('');
    saveMutation.mutate(data);
  }

  function handleDelete() {
    if (deletingDestination) {
      deleteMutation.mutate(deletingDestination.id);
    }
  }

  function handleStatusChange() {
    if (!changingStatusDestination || statusMutation.isPending) return;

    statusMutation.mutate({
      id: changingStatusDestination.id,
      isPublished: !changingStatusDestination.isPublished,
    });
  }

  function resetFilters() {
    setSearch('');
    setPublicationFilter('all');
    setCurrentPage(1);
  }

  const publishedCount = destinations.filter(
    (destination) => destination.isPublished,
  ).length;
  const draftCount = destinations.length - publishedCount;

  return (
    <main dir="rtl" className="space-y-12 text-foreground">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-sm font-semibold text-primary">
            لوحة الإدارة
          </span>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            الوجهات السياحية
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
            إدارة الوجهات والصور والمعلومات الخاصة بها.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90"
        >
          <Plus size={18} />
          إضافة وجهة جديدة
        </button>
      </header>

      {/* Stats */}
      <section className="grid gap-x-8 gap-y-8 sm:grid-cols-3">
        <Stat label="إجمالي الوجهات" value={destinations.length} />
        <Stat label="الوجهات المنشورة" value={publishedCount} />
        <Stat label="المسودات" value={draftCount} />
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
            placeholder="ابحث بالاسم أو البلد أو الرابط..."
            className="w-full border border-border bg-white py-3 pl-4 pr-10 text-sm outline-none transition focus:border-primary"
          />
        </div>

        <select
          value={publicationFilter}
          onChange={(event) => setPublicationFilter(event.target.value)}
          className="border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
        >
          <option value="all">كل الوجهات</option>
          <option value="published">المنشورة فقط</option>
          <option value="draft">المسودات فقط</option>
        </select>

        <button
          type="button"
          onClick={() => void refetch()}
          disabled={isLoading}
          title="تحديث القائمة"
          className="inline-flex items-center justify-center gap-2 border border-border px-5 py-3 text-sm font-semibold transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          تحديث
        </button>

        <div className="flex items-center justify-between text-sm text-muted-foreground md:col-span-3">
          <span>
            عدد النتائج:{' '}
            <span className="font-bold text-foreground">
              {filteredDestinations.length}
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
            جارٍ تحميل الوجهات...
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
        ) : paginatedDestinations.length === 0 ? (
          <div className="border-b border-border py-16 text-center">
            <MapPin size={32} className="mx-auto text-primary" />
            <h2 className="mt-4 text-lg font-bold">لا توجد وجهات</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {search || publicationFilter !== 'all'
                ? 'لم نعثر على نتائج مطابقة للبحث.'
                : 'أضف وجهتك الأولى للبدء.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-right text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground text-xs font-bold text-muted-foreground">
                    <th className="px-4 py-4">الوجهة</th>
                    <th className="px-4 py-4">البلد</th>
                    <th className="px-4 py-4">الرابط</th>
                    <th className="px-4 py-4">الحالة</th>
                    <th className="px-4 py-4">الترتيب</th>
                    <th className="px-4 py-4">تاريخ الإضافة</th>
                    <th className="px-4 py-4">الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedDestinations.map((destination) => (
                    <tr
                      key={destination.id}
                      className="border-b border-border transition hover:bg-muted"
                    >
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-14 w-20 shrink-0 overflow-hidden bg-muted">
                            {destination.imageUrl ? (
                              <img
                                src={destination.imageUrl}
                                alt={destination.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                                <ImagePlus size={20} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold">{destination.name}</p>
                            <p className="mt-1 max-w-52 truncate text-xs text-muted-foreground">
                              {destination.description || 'بدون وصف'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-5">
                        {destination.country || '-'}
                      </td>

                      <td className="px-4 py-5 text-muted-foreground">
                        {destination.slug}
                      </td>

                      <td className="px-4 py-5">
                        <StatusBadge isPublished={destination.isPublished} />
                      </td>

                      <td className="px-4 py-5 tabular-nums">
                        {destination.sortOrder}
                      </td>

                      <td className="whitespace-nowrap px-4 py-5 text-muted-foreground">
                        {formatDate(destination.createdAt)}
                      </td>

                      <td className="px-4 py-5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(destination)}
                            title="تعديل الوجهة"
                            aria-label="تعديل الوجهة"
                            className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              statusMutation.reset();
                              setChangingStatusDestination(destination);
                            }}
                            title={
                              destination.isPublished
                                ? 'تحويل إلى مسودة'
                                : 'نشر الوجهة'
                            }
                            aria-label={
                              destination.isPublished
                                ? 'تحويل إلى مسودة'
                                : 'نشر الوجهة'
                            }
                            disabled={statusMutation.isPending}
                            className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
                          >
                            <RefreshCw size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingDestination(destination)}
                            title="حذف الوجهة"
                            aria-label="حذف الوجهة"
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

            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={filteredDestinations.length}
              perPage={PER_PAGE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </section>

      {isFormOpen && (
        <DestinationModal
          key={editingDestination?.id ?? 'new-destination'}
          destination={editingDestination}
          isSaving={saveMutation.isPending}
          error={formError}
          onClose={closeForm}
          onSubmit={handleSave}
        />
      )}

      {deletingDestination && (
        <DeleteModal
          destinationName={deletingDestination.name}
          isDeleting={deleteMutation.isPending}
          error={
            deleteMutation.isError ? getErrorMessage(deleteMutation.error) : ''
          }
          onClose={() => {
            if (!deleteMutation.isPending) {
              setDeletingDestination(null);
            }
          }}
          onConfirm={handleDelete}
        />
      )}

      {changingStatusDestination && (
        <DestinationStatusModal
          destination={changingStatusDestination}
          isSaving={statusMutation.isPending}
          error={
            statusMutation.isError ? getErrorMessage(statusMutation.error) : ''
          }
          onClose={() => {
            if (!statusMutation.isPending) {
              setChangingStatusDestination(null);
              statusMutation.reset();
            }
          }}
          onConfirm={handleStatusChange}
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

function DestinationModal({
  destination,
  isSaving,
  error,
  onClose,
  onSubmit,
}: {
  destination: Destination | null;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (data: DestinationFormData) => void;
}) {
  const [form, setForm] = useState<DestinationFormData>(() => ({
    name: destination?.name ?? '',
    slug: destination?.slug ?? '',
    country: destination?.country ?? '',
    description: destination?.description ?? '',
    imageUrl: destination?.imageUrl ?? '',
    isPublished: destination?.isPublished ?? false,
    sortOrder: destination?.sortOrder ?? 0,
  }));

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(destination?.imageUrl ?? '');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusy = isSaving || isUploading;

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(form.imageUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, form.imageUrl]);

  function updateField<K extends keyof DestinationFormData>(
    field: K,
    value: DestinationFormData[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleNameChange(value: string) {
    setForm((previous) => ({
      ...previous,
      name: value,
      slug: slugManuallyEdited ? previous.slug : slugify(value),
    }));
  }

  function handleSlugChange(value: string) {
    setSlugManuallyEdited(true);
    updateField('slug', value);
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageError('');

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('نوع الملف غير مدعوم. اختر صورة بصيغة JPG أو PNG أو WebP.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.');
      event.target.value = '';
      return;
    }

    setImageFile(file);
    updateField('imageUrl', '');
  }

  function removeImage() {
    setImageFile(null);
    setImageError('');
    setPreviewUrl('');
    updateField('imageUrl', '');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim()) return;

    let imageUrl = form.imageUrl.trim();

    if (imageFile) {
      setIsUploading(true);
      setImageError('');

      try {
        imageUrl = await uploadDestinationImage(imageFile);
      } catch (uploadError) {
        setImageError(getErrorMessage(uploadError));
        setIsUploading(false);
        return;
      }

      setIsUploading(false);
    }

    onSubmit({
      ...form,
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      country: form.country.trim(),
      description: form.description.trim(),
      imageUrl,
      sortOrder: Number(form.sortOrder) || 0,
    });
  }

  const inputClass =
    'w-full border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-muted';
  const labelClass = 'mb-1.5 block text-sm font-bold';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="destination-modal-title"
        className="my-3 w-full max-w-3xl overflow-hidden bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-6 sm:px-8">
          <div>
            <span className="text-sm font-semibold text-primary">
              {destination ? 'تعديل' : 'إضافة'}
            </span>
            <h2
              id="destination-modal-title"
              className="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl"
            >
              {destination ? 'تعديل الوجهة' : 'إضافة وجهة جديدة'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              أدخل معلومات الوجهة وصورتها.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            aria-label="إغلاق"
            className="flex h-10 w-10 shrink-0 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[calc(100dvh-220px)] space-y-5 overflow-y-auto p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="destination-name" className={labelClass}>
                  اسم الوجهة <span className="text-red-500">*</span>
                </label>
                <input
                  id="destination-name"
                  type="text"
                  required
                  maxLength={150}
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="مثال: وادي سوف"
                  disabled={isBusy}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="destination-country" className={labelClass}>
                  البلد
                </label>
                <input
                  id="destination-country"
                  type="text"
                  value={form.country}
                  onChange={(event) =>
                    updateField('country', event.target.value)
                  }
                  placeholder="الجزائر"
                  disabled={isBusy}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="destination-slug" className={labelClass}>
                  الرابط المختصر
                </label>
                <input
                  id="destination-slug"
                  type="text"
                  value={form.slug}
                  onChange={(event) => handleSlugChange(event.target.value)}
                  placeholder="oued-souf"
                  disabled={isBusy}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  يُنشأ تلقائيًا من الاسم.
                </p>
              </div>

              <div>
                <label
                  htmlFor="destination-sort-order"
                  className={labelClass}
                >
                  ترتيب العرض
                </label>
                <input
                  id="destination-sort-order"
                  type="number"
                  min={0}
                  step={1}
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateField(
                      'sortOrder',
                      Math.max(0, Number(event.target.value) || 0),
                    )
                  }
                  disabled={isBusy}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label htmlFor="destination-description" className={labelClass}>
                الوصف
              </label>
              <textarea
                id="destination-description"
                rows={2}
                value={form.description}
                onChange={(event) =>
                  updateField('description', event.target.value)
                }
                placeholder="اكتب وصفًا مختصرًا للوجهة..."
                disabled={isBusy}
                className={`${inputClass} resize-y`}
              />
            </div>

            <div>
              <label className={labelClass}>صورة الوجهة</label>
              <input
                ref={fileInputRef}
                id="destination-image-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                disabled={isBusy}
                className="sr-only"
              />

              {previewUrl ? (
                <div className="flex flex-col gap-4 border border-border p-3 sm:flex-row sm:items-center">
                  <div className="relative h-32 w-full shrink-0 overflow-hidden bg-muted sm:w-48">
                    <img
                      src={previewUrl}
                      alt="معاينة صورة الوجهة"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <p className="truncate text-xs text-muted-foreground">
                      {imageFile ? imageFile.name : 'الصورة الحالية'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-50"
                      >
                        <Upload size={16} />
                        تغيير الصورة
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        disabled={isBusy}
                        className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        إزالة
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      JPG أو PNG أو WebP — الحد الأقصى 5 ميغابايت
                    </p>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isBusy}
                  className="flex min-h-28 w-full items-center justify-center gap-4 border-2 border-dashed border-border bg-muted p-5 text-right transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-12 w-12 items-center justify-center border border-primary/40 bg-white text-primary">
                    <ImagePlus size={22} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">
                      اختر صورة من جهازك
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      JPG أو PNG أو WebP — حتى 5 ميغابايت
                    </span>
                  </span>
                </button>
              )}

              {imageError && (
                <p className="mt-2 text-sm text-red-600">{imageError}</p>
              )}
              {isUploading && (
                <p className="mt-2 text-sm text-muted-foreground">
                  جارٍ رفع الصورة...
                </p>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-3 border border-border p-4">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(event) =>
                  updateField('isPublished', event.target.checked)
                }
                disabled={isBusy}
                className="h-4 w-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-bold">نشر الوجهة</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  عند التفعيل، تصبح الوجهة منشورة بدلًا من مسودة.
                </span>
              </span>
            </label>

            {error && (
              <div
                role="alert"
                className="border border-red-600/40 p-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-border px-6 py-5 sm:flex-row sm:justify-start sm:px-8">
            <button
              type="submit"
              disabled={isBusy || !form.name.trim()}
              className="inline-flex items-center justify-center gap-2 bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBusy && <RefreshCw size={16} className="animate-spin" />}
              {isUploading
                ? 'جارٍ رفع الصورة...'
                : isSaving
                  ? 'جارٍ الحفظ...'
                  : destination
                    ? 'حفظ التعديلات'
                    : 'إضافة الوجهة'}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="border border-border px-7 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-50"
            >
              إلغاء
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function DeleteModal({
  destinationName,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: {
  destinationName: string;
  isDeleting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-destination-title"
        className="w-full max-w-md bg-white p-8 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center border border-red-600/40 text-red-600">
            <Trash2 size={21} />
          </span>

          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="delete-destination-title"
          className="mt-6 text-xl font-extrabold tracking-tight"
        >
          حذف الوجهة
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          هل أنت متأكد من حذف وجهة{' '}
          <span className="font-bold text-foreground">{destinationName}</span>؟
          لا يمكن التراجع عن هذا الإجراء.
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
      </section>
    </div>
  );
}

function DestinationStatusModal({
  destination,
  isSaving,
  error,
  onClose,
  onConfirm,
}: {
  destination: Destination;
  isSaving: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const willPublish = !destination.isPublished;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="destination-status-title"
        className="w-full max-w-md bg-white p-8 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center border border-primary/40 text-primary">
            {willPublish ? <Globe size={21} /> : <FileText size={21} />}
          </span>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="destination-status-title"
          className="mt-6 text-xl font-extrabold tracking-tight"
        >
          {willPublish ? 'نشر الوجهة' : 'تحويل الوجهة إلى مسودة'}
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {willPublish
            ? `هل تريد نشر «${destination.name}»؟ ستصبح متاحة للزوار على الموقع.`
            : `هل تريد تحويل «${destination.name}» إلى مسودة؟ لن تظهر للزوار بعد ذلك.`}
        </p>

        <div className="mt-5 border-y border-border py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">الحالة الحالية</span>
            <StatusBadge isPublished={destination.isPublished} />
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
            {isSaving && <RefreshCw size={16} className="animate-spin" />}
            {isSaving
              ? 'جارٍ الحفظ...'
              : willPublish
                ? 'نشر الوجهة'
                : 'تحويل إلى مسودة'}
          </button>

          <button
            type="button"
            onClick={onClose}
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