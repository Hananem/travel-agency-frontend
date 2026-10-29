'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, X, ArrowRight, LoaderCircle } from 'lucide-react';
import { announcementsService } from '@/services/announcements.service';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

type AnnouncementType = 'news' | 'offer' | 'alert';

type AnnouncementForm = {
  title: string;
  type: AnnouncementType;
  content: string;
  isPublished: boolean;
};

const initialForm: AnnouncementForm = {
  title: '',
  type: 'news',
  content: '',
  isPublished: true,
};

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3000/uploads', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.message || 'تعذر رفع الصورة. حاولي مرة أخرى.',
    );
  }

  const imageUrl = result?.url ?? result?.imageUrl;

  if (typeof imageUrl !== 'string' || !imageUrl) {
    throw new Error('لم يُرجع الخادم رابط الصورة بعد رفعها.');
  }

  return imageUrl;
}

export default function NewAnnouncementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<AnnouncementForm>(initialForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(imageFile);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [imageFile]);

  const createMutation = useMutation({
    mutationFn: async () => {
      // الصورة اختيارية: نرفعها فقط إن وُجدت
      const imageUrl = imageFile ? await uploadImage(imageFile) : undefined;

      return announcementsService.createAnnouncement({
        title: form.title.trim(),
        type: form.type,
        content: form.content.trim(),
        imageUrl,
        isPublished: form.isPublished,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['announcements'] });
      router.push('/admin/announcements');
    },
  });

  function updateField<K extends keyof AnnouncementForm>(
    field: K,
    value: AnnouncementForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createMutation.isPending) return;

    if (!form.title.trim() || !form.content.trim()) return;

    setImageError('');
    createMutation.mutate();
  }

  const inputClass =
    'w-full border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary';
  const labelClass = 'mb-2 block text-sm font-bold';

  return (
    <main dir="rtl" className="mx-auto w-full max-w-4xl space-y-12 text-foreground">
      {/* Header */}
      <header>
        <Link
          href="/admin/announcements"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
        >
          <ArrowRight size={16} />
          العودة إلى الإعلانات
        </Link>

        <span className="mt-8 block text-sm font-semibold text-primary">
          إعلان جديد
        </span>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          إنشاء إعلان جديد
        </h1>

        <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
          أضيفي خبرًا أو عرضًا أو تنبيهًا لزوار الموقع.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid gap-6 border-t border-border pt-8 md:grid-cols-2">
          <div className="md:col-span-2">
            <label htmlFor="title" className={labelClass}>
              عنوان الإعلان <span className="text-red-500">*</span>
            </label>

            <input
              id="title"
              type="text"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
              maxLength={200}
              placeholder="مثال: عرض خاص إلى تونس"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="type" className={labelClass}>
              نوع الإعلان
            </label>

            <select
              id="type"
              value={form.type}
              onChange={(e) =>
                updateField('type', e.target.value as AnnouncementType)
              }
              className={inputClass}
            >
              <option value="news">خبر</option>
              <option value="offer">عرض سياحي</option>
              <option value="alert">تنبيه أو تغيير في رحلة</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="content" className={labelClass}>
              محتوى الإعلان <span className="text-red-500">*</span>
            </label>

            <textarea
              id="content"
              value={form.content}
              onChange={(e) => updateField('content', e.target.value)}
              required
              rows={6}
              maxLength={10000}
              placeholder="اكتبي تفاصيل الإعلان..."
              className={`${inputClass} resize-y`}
            />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="mb-3 block text-sm font-bold">
            صورة الإعلان{' '}
            <span className="text-xs font-normal text-muted-foreground">
              (اختيارية)
            </span>
          </label>

          <label
            htmlFor="announcement-image"
            className="group relative flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed border-border bg-muted transition hover:border-primary"
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="معاينة صورة الإعلان"
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
              id="announcement-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              disabled={createMutation.isPending}
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
                disabled={createMutation.isPending}
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
        <label className="flex cursor-pointer items-center gap-3 border border-border p-4 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => updateField('isPublished', e.target.checked)}
            disabled={createMutation.isPending}
            className="h-4 w-4 cursor-pointer accent-primary"
          />
          نشر الإعلان على الموقع
        </label>

        {createMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'تعذر حفظ الإعلان.'}
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-8">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="inline-flex items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending && (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            )}
            {createMutation.isPending
              ? 'جارٍ رفع الصورة وحفظ الإعلان...'
              : 'حفظ الإعلان'}
          </button>

          <Link
            href="/admin/announcements"
            className="border border-border px-8 py-3.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </main>
  );
}