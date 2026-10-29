'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X, ArrowRight, LoaderCircle } from 'lucide-react';

import {
  teamService,
  type CreateTeamMemberData,
} from '@/services/team.service';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3000/uploads', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || 'تعذر رفع الصورة. يرجى المحاولة مرة أخرى.');
  }

  const imageUrl = result?.url ?? result?.imageUrl;

  if (typeof imageUrl !== 'string' || !imageUrl) {
    throw new Error('لم يُرجع الخادم رابط الصورة بعد رفعها.');
  }

  return imageUrl;
}

export default function NewTeamMemberPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [bio, setBio] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isPublished, setIsPublished] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateTeamMemberData) => {
      // الصورة اختيارية: نرفعها فقط إن وُجدت
      const imageUrl = imageFile ? await uploadImage(imageFile) : undefined;

      return teamService.createMember({
        ...data,
        imageUrl,
      });
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team'] });
      router.push('/admin/team');
      router.refresh();
    },

    onError: (error: Error) => {
      setErrorMessage(error.message || 'حدث خطأ أثناء إضافة العضو.');
    },
  });

  function handleImageChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    // Allow choosing the same file again after removing it.
    e.target.value = '';

    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('اختاري صورة بصيغة JPG أو PNG أو WebP.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.');
      return;
    }

    setImageError('');
    setImageFile(file);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (createMutation.isPending) return;

    setErrorMessage('');

    const numericSortOrder = Number(sortOrder);

    if (!name.trim() || !position.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل والمنصب الوظيفي.');
      return;
    }

    if (!Number.isInteger(numericSortOrder) || numericSortOrder < 0) {
      setErrorMessage('ترتيب الظهور يجب أن يكون عددًا صحيحًا غير سالب.');
      return;
    }

    const data: CreateTeamMemberData = {
      name: name.trim(),
      position: position.trim(),
      bio: bio.trim() || undefined,
      sortOrder: numericSortOrder,
      isPublished,
    };

    createMutation.mutate(data);
  }

  const isSubmitting = createMutation.isPending;

  const inputClass =
    'w-full border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary';
  const labelClass = 'mb-2 block text-sm font-bold';

  return (
    <main
      dir="rtl"
      className="mx-auto w-full max-w-4xl space-y-12 text-foreground"
    >
      {/* Header */}
      <header>
        <Link
          href="/admin/team"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
        >
          <ArrowRight size={16} />
          العودة إلى أعضاء الفريق
        </Link>

        <span className="mt-8 block text-sm font-semibold text-primary">
          عضو جديد
        </span>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          إضافة عضو جديد
        </h1>

        <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
          أدخلي معلومات العضو واختاري صورته من جهازك.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid gap-6 border-t border-border pt-8 md:grid-cols-2">
          <div>
            <label htmlFor="name" className={labelClass}>
              الاسم الكامل <span className="text-red-500">*</span>
            </label>

            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={150}
              placeholder="أدخل الاسم الكامل"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="position" className={labelClass}>
              المنصب الوظيفي <span className="text-red-500">*</span>
            </label>

            <input
              id="position"
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
              maxLength={150}
              placeholder="مثال: مدير وكالة السفر"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="bio" className={labelClass}>
              نبذة عن العضو
            </label>

            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="اكتبي نبذة مختصرة عن العضو..."
              className={`${inputClass} resize-y`}
            />
          </div>

          <div>
            <label htmlFor="sortOrder" className={labelClass}>
              ترتيب الظهور
            </label>

            <input
              id="sortOrder"
              type="number"
              min="0"
              step="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className={inputClass}
            />

            <p className="mt-1 text-xs text-muted-foreground">
              الأرقام الأصغر تظهر أولًا.
            </p>
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="mb-3 block text-sm font-bold">
            صورة العضو{' '}
            <span className="text-xs font-normal text-muted-foreground">
              (اختيارية)
            </span>
          </label>

          <label
            htmlFor="member-image"
            className="group relative flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed border-border bg-muted transition hover:border-primary"
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="معاينة صورة العضو"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 px-4 py-3 text-center text-sm text-white">
                  اضغطي لاختيار صورة أخرى
                </span>
              </>
            ) : (
              <>
                <span className="mb-4 flex h-14 w-14 items-center justify-center border border-primary/40 bg-white text-primary">
                  <ImagePlus className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold">اضغطي لاختيار صورة</span>
                <span className="mt-2 text-xs text-muted-foreground">
                  JPG أو PNG أو WebP — بحد أقصى 5 ميغابايت
                </span>
              </>
            )}

            <input
              id="member-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={isSubmitting}
              className="sr-only"
            />
          </label>

          {imageFile && (
            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-muted-foreground">
                {imageFile.name}
              </span>

              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImageError('');
                }}
                disabled={isSubmitting}
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-red-600 transition hover:text-red-700 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                إزالة الصورة
              </button>
            </div>
          )}

          {imageError && (
            <p role="alert" className="mt-2 text-sm text-red-600">
              {imageError}
            </p>
          )}
        </div>

        {/* Publish */}
        <label
          htmlFor="isPublished"
          className="flex cursor-pointer items-center gap-3 border border-border p-4 text-sm font-bold"
        >
          <input
            id="isPublished"
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            disabled={isSubmitting}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          نشر العضو على الموقع
        </label>

        {errorMessage && (
          <p role="alert" className="text-sm text-red-600">
            {errorMessage}
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
            {isSubmitting ? 'جارٍ الحفظ...' : 'إضافة العضو'}
          </button>

          <Link
            href="/admin/team"
            className="border border-border px-8 py-3.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </main>
  );
}