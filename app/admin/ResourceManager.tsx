
'use client';

import { useCallback, useEffect, useState } from 'react';

type Field = {
  name: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'checkbox' | 'select';
  required?: boolean;
  options?: { label: string; value: string }[];
};

type Item = Record<string, any> & { id: string };

type Props = {
  title: string;
  description: string;
  endpoint: string;
  fields: Field[];
  columns: { key: string; label: string }[];
  defaults: Record<string, any>;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://travel-agency-backend-three.vercel.app';

export default function ResourceManager({
  title,
  description,
  endpoint,
  fields,
  columns,
  defaults,
}: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState<Record<string, any>>(defaults);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getToken = () => {
    if (typeof window === 'undefined') return '';

    return (
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      ''
    );
  };

  const request = async (path: string, options: RequestInit = {}) => {
    const token = getToken();

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(
        message || `حدث خطأ في الطلب (${response.status})`,
      );
    }

    if (response.status === 204) return null;

    const text = await response.text();
    return text ? JSON.parse(text) : null;
  };

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await request(`${endpoint}/admin/all`);
      setItems(Array.isArray(result) ? result : result?.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'تعذر تحميل البيانات',
      );
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setForm({ ...defaults });
    setEditingId(null);
  };

  const startEditing = (item: Item) => {
    const values: Record<string, any> = {};

    fields.forEach((field) => {
      values[field.name] =
        item[field.name] ?? defaults[field.name] ?? '';
    });

    setForm(values);
    setEditingId(item.id);
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = { ...form };

      fields.forEach((field) => {
        if (field.type === 'number') {
          payload[field.name] = Number(payload[field.name] || 0);
        }
      });

      await request(
        editingId
          ? `${endpoint}/${editingId}`
          : endpoint,
        {
          method: editingId ? 'PATCH' : 'POST',
          body: JSON.stringify(payload),
        },
      );

      setSuccess(
        editingId
          ? 'تم تحديث البيانات بنجاح.'
          : 'تمت الإضافة بنجاح.',
      );

      resetForm();
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'تعذر حفظ البيانات',
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (item: Item) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
      return;
    }

    setError('');
    setSuccess('');

    try {
      await request(`${endpoint}/${item.id}`, {
        method: 'DELETE',
      });

      setSuccess('تم الحذف بنجاح.');
      await loadItems();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'تعذر حذف العنصر',
      );
    }
  };

  const displayValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'نعم' : 'لا';
    }

    if (value === null || value === undefined || value === '') {
      return '—';
    }

    return String(value);
  };

  return (
    <div dir="rtl" className="space-y-8 text-slate-800">
      <header>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="mt-2 text-slate-500">{description}</p>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="mb-6 text-xl font-semibold">
          {editingId ? 'تعديل البيانات' : 'إضافة جديد'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <div
                key={field.name}
                className={
                  field.type === 'textarea'
                    ? 'md:col-span-2'
                    : ''
                }
              >
                {field.type === 'checkbox' ? (
                  <label className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.name])}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          [field.name]: event.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-medium">
                      {field.label}
                    </span>
                  </label>
                ) : (
                  <>
                    <label
                      htmlFor={field.name}
                      className="mb-2 block text-sm font-medium"
                    >
                      {field.label}
                    </label>

                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.name}
                        required={field.required}
                        value={form[field.name] ?? ''}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [field.name]: event.target.value,
                          })
                        }
                        rows={4}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                      />
                    ) : field.type === 'select' ? (
                      <select
                        id={field.name}
                        required={field.required}
                        value={form[field.name] ?? ''}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [field.name]: event.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                      >
                        {field.options?.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={field.name}
                        type={field.type}
                        required={field.required}
                        min={field.type === 'number' ? 0 : undefined}
                        value={form[field.name] ?? ''}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            [field.name]: event.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                      />
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-white disabled:opacity-50"
            >
              {saving
                ? 'جارٍ الحفظ...'
                : editingId
                  ? 'حفظ التعديلات'
                  : 'إضافة'}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-2.5"
              >
                إلغاء التعديل
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <h2 className="text-xl font-semibold">قائمة البيانات</h2>
          <button
            onClick={() => void loadItems()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
          >
            تحديث القائمة
          </button>
        </div>

        {loading ? (
          <p className="p-6 text-slate-500">جارٍ تحميل البيانات...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-slate-500">
            لا توجد بيانات لعرضها حاليًا.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold">
                      {column.label}
                    </th>
                  ))}
                  <th className="whitespace-nowrap px-4 py-3">الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className="max-w-xs px-4 py-4"
                      >
                        <span className="line-clamp-2">
                          {displayValue(item[column.key])}
                        </span>
                      </td>
                    ))}

                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex gap-3">
                        <button
                          onClick={() => startEditing(item)}
                          className="font-medium text-blue-700"
                        >
                          تعديل
                        </button>
                        <button
                          onClick={() => void deleteItem(item)}
                          className="font-medium text-red-700"
                        >
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
