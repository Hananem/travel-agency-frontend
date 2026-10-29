
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  teamService,
  type CreateTeamMemberData,
} from '@/services/team.service';

export default function EditTeamMemberPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const router = useRouter();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bio, setBio] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [isPublished, setIsPublished] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [initialized, setInitialized] = useState(false);

  const {
    data: member,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamService.getMember(id),
    enabled: Boolean(id),
  });

  useEffect(() => {
    if (!member || initialized) return;

    setName(member.name);
    setPosition(member.position);
    setImageUrl(member.imageUrl ?? '');
    setBio(member.bio ?? '');
    setSortOrder(String(member.sortOrder));
    setIsPublished(member.isPublished);
    setInitialized(true);
  }, [member, initialized]);

  const updateMutation = useMutation({
    mutationFn: (data: CreateTeamMemberData) =>
      teamService.updateMember(id, data),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['team'] }),
        queryClient.invalidateQueries({ queryKey: ['team', id] }),
      ]);

      router.push('/admin/team');
      router.refresh();
    },

    onError: (err: Error) => {
      setErrorMessage(err.message || 'حدث خطأ أثناء تحديث العضو.');
    },
  });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    const parsedSortOrder = Number(sortOrder);

    if (!name.trim() || !position.trim()) {
      setErrorMessage('يرجى إدخال الاسم الكامل والمنصب الوظيفي.');
      return;
    }

    if (
      !Number.isInteger(parsedSortOrder) ||
      parsedSortOrder < 0
    ) {
      setErrorMessage('ترتيب الظهور يجب أن يكون عددًا صحيحًا غير سالب.');
      return;
    }

    const data: CreateTeamMemberData = {
      name: name.trim(),
      position: position.trim(),
      imageUrl: imageUrl.trim() || undefined,
      bio: bio.trim() || undefined,
      sortOrder: parsedSortOrder,
      isPublished,
    };

    updateMutation.mutate(data);
  }

  if (isLoading) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl p-6 text-slate-600">
        جارٍ تحميل بيانات العضو...
      </main>
    );
  }

  if (isError) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-2xl font-bold">تعذر تحميل العضو</h1>
        <p role="alert" className="text-red-600">
          {error instanceof Error
            ? error.message
            : 'حدث خطأ أثناء تحميل البيانات.'}
        </p>
        <Link href="/admin/team" className="text-slate-600 underline">
          العودة إلى فريق العمل
        </Link>
      </main>
    );
  }

  if (!member) {
    return (
      <main dir="rtl" className="mx-auto max-w-3xl p-6">
        لم يتم العثور على العضو.
        <div className="mt-4">
          <Link href="/admin/team" className="underline">
            العودة إلى فريق العمل
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="mx-auto max-w-3xl space-y-6 text-slate-800">
      <div>
        <Link
          href="/admin/team"
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          فريق العمل / العودة إلى الفريق
        </Link>

        <h1 className="mt-4 text-3xl font-bold">تعديل بيانات العضو</h1>

        <p className="mt-2 text-slate-500">
          عدّلي بيانات عضو فريق الوكالة ثم احفظي التغييرات.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border bg-white p-6"
      >
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium">
            الاسم الكامل <span className="text-red-600">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم الكامل للعضو"
            required
            maxLength={150}
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="position"
            className="mb-2 block text-sm font-medium"
          >
            المنصب الوظيفي <span className="text-red-600">*</span>
          </label>
          <input
            id="position"
            type="text"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            placeholder="مثال: مستشار سياحي"
            required
            maxLength={150}
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
            placeholder="https://example.com/photo.jpg"
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-2 block text-sm font-medium">
            نبذة تعريفية
          </label>
          <textarea
            id="bio"
            rows={5}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="نبذة مختصرة عن العضو..."
            maxLength={5000}
            className="w-full rounded-lg border p-3 outline-none focus:border-slate-500"
          />
        </div>

        <div>
          <label
            htmlFor="sortOrder"
            className="mb-2 block text-sm font-medium"
          >
            ترتيب الظهور
          </label>
          <input
            id="sortOrder"
            type="number"
            min={0}
            step={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
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
          إظهار العضو على الموقع
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
            className="rounded-lg bg-slate-900 px-6 py-3 text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updateMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
          </button>

          <Link
            href="/admin/team"
            className="rounded-lg border px-6 py-3 transition hover:bg-slate-50"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </main>
  );
}
