'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  useEffect,
  useState,
  type FormEvent,
  type ChangeEvent,
} from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { ImagePlus, X, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { tripsService } from '@/services/trips.service';
import { teamService } from '@/services/team.service';

type CompanionRow = {
  teamMemberId: string;
  role: string;
};

type TripForm = {
  title: string;
  slug: string;
  destination: string;
  price: string;
  duration: string;
  description: string;
  isPublished: boolean;
  startDate: string; // datetime-local: "2026-12-05T06:30"
  endDate: string;
  capacity: string;
  features: string[];
  companions: CompanionRow[];
};

const initialForm: TripForm = {
  title: '',
  slug: '',
  destination: '',
  price: '',
  duration: '',
  description: '',
  isPublished: false,
  startDate: '',
  endDate: '',
  capacity: '',
  features: [],
  companions: [],
};

const ROLE_SUGGESTIONS = ['مرشد سياحي', 'سائق', 'مسؤول المجموعة'];

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

// "2026-12-05T06:30" (توقيت جهاز المستخدم) -> ISO UTC
function toIso(localValue: string): string {
  return new Date(localValue).toISOString();
}

export default function NewTripPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState<TripForm>(initialForm);
  const [slugEdited, setSlugEdited] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [formError, setFormError] = useState('');

  const teamQuery = useQuery({
    queryKey: ['team-members', 'admin'],
    queryFn: teamService.getMembers,
  });

  const teamMembers = teamQuery.data?.data ?? [];

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
      if (!imageFile) {
        throw new Error('اختار صورة للرحلة أولًا.');
      }

      const imageUrl = await uploadImage(imageFile);

      return tripsService.createTrip({
        title: form.title.trim(),
        slug: form.slug.trim(),
        destination: form.destination.trim(),
        price: Number(form.price),
        duration: form.duration.trim(),
        imageUrl,
        description: form.description.trim(),
        isPublished: form.isPublished,
        startDate: toIso(form.startDate),
        ...(form.endDate ? { endDate: toIso(form.endDate) } : {}),
        ...(form.capacity ? { capacity: Number(form.capacity) } : {}),
        features: form.features,
        companions: form.companions.map((c) => ({
          teamMemberId: c.teamMemberId,
          ...(c.role.trim() ? { role: c.role.trim() } : {}),
        })),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['trips'] });
      router.push('/admin/trips');
    },
  });

  function updateField<K extends keyof TripForm>(
    field: K,
    value: TripForm[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function generateSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function handleTitleChange(value: string) {
    updateField('title', value);

    if (!slugEdited) {
      updateField('slug', generateSlug(value));
    }
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setImageError('اختار صورة بصيغة JPG أو PNG أو WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageError('حجم الصورة يجب ألا يتجاوز 5 ميغابايت.');
      return;
    }

    setImageError('');
    setImageFile(file);
  }

  // ---------- المميزات ----------

  function addFeature() {
    const value = featureInput.trim();
    if (!value) return;

    if (form.features.includes(value)) {
      setFeatureInput('');
      return;
    }

    if (form.features.length >= 20) {
      setFormError('الحد الأقصى 20 ميزة.');
      return;
    }

    setFormError('');
    updateField('features', [...form.features, value]);
    setFeatureInput('');
  }

  function removeFeature(value: string) {
    updateField(
      'features',
      form.features.filter((f) => f !== value),
    );
  }

  // ---------- المرافقون ----------

  function addCompanion() {
    updateField('companions', [
      ...form.companions,
      { teamMemberId: '', role: '' },
    ]);
  }

  function updateCompanion(index: number, patch: Partial<CompanionRow>) {
    updateField(
      'companions',
      form.companions.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    );
  }

  function removeCompanion(index: number) {
    updateField(
      'companions',
      form.companions.filter((_, i) => i !== index),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createMutation.isPending) return;

    if (!imageFile) {
      setImageError('اختار صورة للرحلة قبل الحفظ.');
      return;
    }

    if (!form.startDate) {
      setFormError('حدد تاريخ ووقت انطلاق الرحلة.');
      return;
    }

    if (form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      setFormError('تاريخ النهاية يجب أن يكون بعد تاريخ البداية.');
      return;
    }

    if (form.capacity && Number(form.capacity) < 1) {
      setFormError('عدد المقاعد يجب أن يكون 1 على الأقل.');
      return;
    }

    if (form.companions.some((c) => !c.teamMemberId)) {
      setFormError('اختر عضو الفريق في كل صف مرافق، أو احذف الصف الفارغ.');
      return;
    }

    const ids = form.companions.map((c) => c.teamMemberId);
    if (new Set(ids).size !== ids.length) {
      setFormError('لا يمكن اختيار نفس العضو أكثر من مرة.');
      return;
    }

    setFormError('');
    setImageError('');
    createMutation.mutate();
  }

  return (
    <main dir="rtl" className="mx-auto max-w-4xl space-y-12 text-foreground">
      {/* Header */}
      <header>
        <Link
          href="/admin/trips"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-primary"
        >
          <ArrowRight size={16} />
          العودة إلى الرحلات
        </Link>

        <span className="mt-8 block text-sm font-semibold text-primary">
          رحلة جديدة
        </span>

        <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
          إضافة رحلة جديدة
        </h1>

        <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
          أدخل معلومات الرحلة السياحية واختار صورتها من جهازك.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <div className="grid gap-6 border-t border-border pt-8 md:grid-cols-2">
          <Field
            label="اسم الرحلة"
            value={form.title}
            onChange={handleTitleChange}
            placeholder="رحلة إلى تونس"
            required
          />

          <Field
            label="الرابط المختصر"
            value={form.slug}
            onChange={(value) => {
              setSlugEdited(true);
              updateField('slug', value);
            }}
            placeholder="trip-to-tunisia"
            dir="ltr"
            required
          />

          <Field
            label="الوجهة السياحية"
            value={form.destination}
            onChange={(value) => updateField('destination', value)}
            placeholder="تونس العاصمة"
            required
          />

          <Field
            label="السعر بالدينار الجزائري"
            value={form.price}
            onChange={(value) => updateField('price', value)}
            placeholder="45000"
            type="number"
            min="0"
            step="0.01"
            required
          />

          <Field
            label="مدة الرحلة"
            value={form.duration}
            onChange={(value) => updateField('duration', value)}
            placeholder="5 أيام / 4 ليالٍ"
            required
          />

          <Field
            label="عدد المقاعد (اتركه فارغاً لغير محدود)"
            value={form.capacity}
            onChange={(value) => updateField('capacity', value)}
            placeholder="30"
            type="number"
            min="1"
            step="1"
          />

          <Field
            label="تاريخ ووقت الانطلاق"
            value={form.startDate}
            onChange={(value) => updateField('startDate', value)}
            placeholder=""
            type="datetime-local"
            dir="ltr"
            required
          />

          <Field
            label="تاريخ ووقت العودة (اختياري)"
            value={form.endDate}
            onChange={(value) => updateField('endDate', value)}
            placeholder=""
            type="datetime-local"
            dir="ltr"
          />
        </div>

        {/* Features */}
        <div>
          <label htmlFor="feature-input" className="mb-2 block text-sm font-bold">
            مميزات الرحلة
          </label>

          <div className="flex gap-2">
            <input
              id="feature-input"
              value={featureInput}
              onChange={(event) => setFeatureInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addFeature();
                }
              }}
              placeholder="مثال: نقل مكيّف، غداء، مرشد سياحي"
              maxLength={100}
              className="w-full border border-border bg-white p-3 text-sm outline-none transition focus:border-primary"
            />

            <button
              type="button"
              onClick={addFeature}
              className="inline-flex shrink-0 items-center gap-1 border border-primary px-5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              <Plus className="h-4 w-4" />
              إضافة
            </button>
          </div>

          {form.features.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {form.features.map((feature) => (
                <li
                  key={feature}
                  className="inline-flex items-center gap-2 border border-border bg-muted px-3 py-1.5 text-sm"
                >
                  {feature}
                  <button
                    type="button"
                    onClick={() => removeFeature(feature)}
                    aria-label={`حذف ${feature}`}
                    className="text-muted-foreground transition hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Companions */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <label className="block text-sm font-bold">
              مرافقو الرحلة من الفريق
            </label>

            <button
              type="button"
              onClick={addCompanion}
              disabled={teamQuery.isLoading || teamMembers.length === 0}
              className="inline-flex items-center gap-1 border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              إضافة مرافق
            </button>
          </div>

          {teamQuery.isLoading && (
            <p className="text-sm text-muted-foreground">
              جارٍ تحميل أعضاء الفريق...
            </p>
          )}

          {teamQuery.isError && (
            <p role="alert" className="text-sm text-red-600">
              تعذر تحميل أعضاء الفريق.
            </p>
          )}

          {!teamQuery.isLoading &&
            !teamQuery.isError &&
            teamMembers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                لا يوجد أعضاء في الفريق بعد. أضف أعضاء من صفحة فريق العمل أولاً.
              </p>
            )}

          {form.companions.length > 0 && (
            <div className="space-y-3">
              {form.companions.map((companion, index) => {
                // لا نعرض الأعضاء المختارين في صفوف أخرى
                const takenByOthers = new Set(
                  form.companions
                    .filter((_, i) => i !== index)
                    .map((c) => c.teamMemberId),
                );

                return (
                  <div
                    key={index}
                    className="grid gap-3 border border-border p-3 md:grid-cols-[1fr_1fr_auto]"
                  >
                    <select
                      value={companion.teamMemberId}
                      onChange={(event) =>
                        updateCompanion(index, {
                          teamMemberId: event.target.value,
                        })
                      }
                      aria-label="عضو الفريق"
                      className="w-full border border-border bg-white p-3 text-sm outline-none transition focus:border-primary"
                    >
                      <option value="">اختر عضو الفريق</option>
                      {teamMembers
                        .filter(
                          (m) =>
                            !takenByOthers.has(m.id) &&
                            (m.isPublished || m.id === companion.teamMemberId),
                        )
                        .map((member) => (
                          <option key={member.id} value={member.id}>
                            {member.name} — {member.position}
                          </option>
                        ))}
                    </select>

                    <input
                      list="role-suggestions"
                      value={companion.role}
                      onChange={(event) =>
                        updateCompanion(index, { role: event.target.value })
                      }
                      placeholder="الدور في هذه الرحلة"
                      maxLength={50}
                      aria-label="الدور"
                      className="w-full border border-border bg-white p-3 text-sm outline-none transition focus:border-primary"
                    />

                    <button
                      type="button"
                      onClick={() => removeCompanion(index)}
                      aria-label="حذف المرافق"
                      className="inline-flex items-center justify-center border border-border px-3 text-red-600 transition hover:border-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              <datalist id="role-suggestions">
                {ROLE_SUGGESTIONS.map((role) => (
                  <option key={role} value={role} />
                ))}
              </datalist>
            </div>
          )}
        </div>

        {/* Image */}
        <div>
          <label className="mb-3 block text-sm font-bold">صورة الرحلة</label>

          <label
            htmlFor="trip-image"
            className="group relative flex min-h-56 cursor-pointer flex-col items-center justify-center overflow-hidden border-2 border-dashed border-border bg-muted transition hover:border-primary"
          >
            {imagePreview ? (
              <>
                <img
                  src={imagePreview}
                  alt="معاينة صورة الرحلة"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 px-4 py-3 text-center text-sm text-white">
                  اضغط لاختيار صورة أخرى
                </span>
              </>
            ) : (
              <>
                <span className="mb-4 flex h-14 w-14 items-center justify-center border border-primary/40 bg-white text-primary">
                  <ImagePlus className="h-6 w-6" />
                </span>
                <span className="text-sm font-bold">اضغط لاختيار صورة</span>
                <span className="mt-2 text-xs text-muted-foreground">
                  JPG أو PNG أو WebP — بحد أقصى 5 ميغابايت
                </span>
              </>
            )}

            <input
              id="trip-image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
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
                className="inline-flex shrink-0 items-center gap-1 font-semibold text-red-600 transition hover:text-red-700"
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

        {/* Description */}
        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-bold">
            وصف الرحلة
          </label>

          <textarea
            id="description"
            rows={5}
            value={form.description}
            onChange={(event) =>
              updateField('description', event.target.value)
            }
            placeholder="تفاصيل البرنامج السياحي والخدمات المشمولة..."
            required
            className="w-full border border-border bg-white p-3 text-sm outline-none transition focus:border-primary"
          />
        </div>

        {/* Publish */}
        <label className="flex cursor-pointer items-center gap-3 border border-border p-4 text-sm font-bold">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(event) =>
              updateField('isPublished', event.target.checked)
            }
            className="h-4 w-4 accent-primary"
          />
          نشر الرحلة على الموقع
        </label>

        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}

        {createMutation.isError && (
          <p role="alert" className="text-sm text-red-600">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : 'تعذر حفظ الرحلة.'}
          </p>
        )}

        <div className="flex flex-wrap gap-3 border-t border-border pt-8">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {createMutation.isPending
              ? 'جارٍ رفع الصورة وحفظ الرحلة...'
              : 'حفظ الرحلة'}
          </button>

          <Link
            href="/admin/trips"
            className="border border-border px-8 py-3.5 text-sm font-semibold transition hover:border-primary hover:text-primary"
          >
            إلغاء
          </Link>
        </div>
      </form>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  dir = 'rtl',
  min,
  step,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  dir?: 'rtl' | 'ltr';
  min?: string;
  step?: string;
  required?: boolean;
}) {
  const id = label;

  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-sm font-bold">
        {label}
      </label>

      <input
        id={id}
        type={type}
        dir={dir}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        required={required}
        className="w-full border border-border bg-white p-3 text-sm outline-none transition focus:border-primary"
      />
    </div>
  );
}