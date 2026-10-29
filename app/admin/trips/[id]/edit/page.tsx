
'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tripsService } from '@/services/trips.service';

export default function EditTripPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [destination, setDestination] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const {
    data: trip,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => tripsService.getTrip(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!trip || initialized) return;

    setTitle(trip.title ?? '');
    setSlug(trip.slug ?? '');
    setDestination(trip.destination ?? '');
    setDescription(trip.description ?? '');
    setPrice(String(trip.price ?? ''));
    setDuration(String(trip.duration));
    setImageUrl(trip.imageUrl ?? '');
    setIsPublished(trip.isPublished);
    setInitialized(true);
  }, [trip, initialized]);

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof tripsService.updateTrip>[1]) =>
      tripsService.updateTrip(id, data),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['trips'] }),
        queryClient.invalidateQueries({ queryKey: ['trip', id] }),
      ]);

      router.push('/admin/trips');
      router.refresh();
    },

    onError: (err: Error) => {
      setErrorMessage(err.message || 'حدث خطأ أثناء تحديث الرحلة.');
    },
  });

  function generateSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\u0600-\u06ff]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleTitleChange(value: string) {
    setTitle(value);

    if (!slugManuallyEdited) {
      setSlug(generateSlug(value));
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    if (
      !title.trim() ||
      !slug.trim() ||
      !destination.trim() ||
      !duration.trim() ||
      !price.trim()
    ) {
      setErrorMessage('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    const parsedPrice = Number(price);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setErrorMessage('يرجى إدخال سعر صحيح وغير سالب.');
      return;
    }

    updateMutation.mutate({
      title: title.trim(),
      slug: slug.trim(),
      destination: destination.trim(),
      description: description.trim(),
      price: parsedPrice,
      duration: duration.trim(),
      imageUrl: imageUrl.trim(),
      isPublished,
    });
  }

  if (isLoading) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl p-6 text-slate-600">
        جارٍ تحميل بيانات الرحلة...
      </main>
    );
  }

  if (isError) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">تعذر تحميل الرحلة</h1>
        <p role="alert" className="text-red-600">
          {error instanceof Error
            ? error.message
            : 'حدث خطأ أثناء تحميل البيانات.'}
        </p>
        <Link href="/admin/trips" className="underline">
          العودة إلى الرحلات
        </Link>
      </main>
    );
  }

  if (!trip) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">الرحلة غير موجودة</h1>
        <Link href="/admin/trips" className="underline">
          العودة إلى الرحلات
        </Link>
      </main>
    );
  }

  return (
    <main
      dir="rtl"
      className="mx-auto max-w-3xl space-y-6 text-slate-800"
    >
      <div>
        <Link
          href="/admin/trips"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          الرحلات / العودة إلى الرحلات
        </Link>

        <h1 className="mt-4 text-3xl font-bold">تعديل الرحلة</h1>

        <p className="mt-2 text-slate-500">
          عدّلي معلومات الرحلة ثم احفظي التغييرات.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6"
      >
        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium">
            عنوان الرحلة *
          </label>
          <input
            id="title"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
            maxLength={200}
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label htmlFor="slug" className="mb-2 block text-sm font-medium">
            الرابط المختصر *
          </label>
          <input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugManuallyEdited(true);
            }}
            required
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            يُستخدم لإنشاء رابط مميز للرحلة.
          </p>
        </div>

        <div>
          <label
            htmlFor="destination"
            className="mb-2 block text-sm font-medium"
          >
            الوجهة *
          </label>
          <input
            id="destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label htmlFor="price" className="mb-2 block text-sm font-medium">
            السعر *
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="duration"
            className="mb-2 block text-sm font-medium"
          >
            المدة *
          </label>
          <input
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="مثال: 5 أيام / 4 ليالٍ"
            required
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="imageUrl"
            className="mb-2 block text-sm font-medium"
          >
            رابط الصورة
          </label>
          <input
            id="imageUrl"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium"
          >
            وصف الرحلة
          </label>
          <textarea
            id="description"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4"
          />
          نشر الرحلة على الموقع
        </label>

        {errorMessage && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={updateMutation.isPending || !initialized}
            className="rounded-lg bg-slate-900 px-6 py-3 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </button>

          <Link
            href="/admin/trips"
            className="rounded-lg border px-6 py-3 hover:bg-slate-50"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </main>
  );
}
