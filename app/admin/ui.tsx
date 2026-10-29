'use client';

import Link from 'next/link';
import { useEffect, type ReactNode } from 'react';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  LoaderCircle,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';

/* ───────────── Page header ───────────── */

export function PageHeader({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          {title}
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">{description}</p>
      </div>

      <Link
        href={actionHref}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
      >
        <Plus size={18} />
        {actionLabel}
      </Link>
    </header>
  );
}

/* ───────────── Stat card ───────────── */

const tones = {
  slate: 'bg-slate-100 text-slate-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-blue-50 text-blue-600',
} as const;

export function StatCard({
  title,
  value,
  icon,
  tone = 'slate',
  loading = false,
}: {
  title: string;
  value: number | string;
  icon: ReactNode;
  tone?: keyof typeof tones;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        {icon}
      </div>

      <div>
        <p className="text-sm text-slate-500">{title}</p>
        {loading ? (
          <div className="mt-2 h-7 w-12 animate-pulse rounded bg-slate-100" />
        ) : (
          <p className="mt-0.5 text-2xl font-bold text-slate-900">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ───────────── Card + toolbar ───────────── */

export function Card({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {children}
    </section>
  );
}

export function Toolbar({
  children,
  count,
  onReset,
}: {
  children: ReactNode;
  count: number;
  onReset: () => void;
}) {
  return (
    <div className="space-y-3 border-b border-slate-200 p-4 sm:p-5">
      <div className="grid gap-3 md:grid-cols-[1fr_repeat(2,minmax(0,200px))]">
        {children}
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          عدد النتائج: <strong className="text-slate-700">{count}</strong>
        </span>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 font-medium text-slate-500 transition hover:text-slate-900"
        >
          <RotateCcw size={13} />
          إعادة ضبط الفلاتر
        </button>
      </div>
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        size={18}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-11 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
      />
    </div>
  );
}

export function SelectFilter({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/* ───────────── Table pieces ───────────── */

export function TableShell({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-right text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500">
            {headers.map((header) => (
              <th key={header} className="px-5 py-3.5 font-semibold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">{children}</tbody>
      </table>
    </div>
  );
}

export function TableSkeleton({
  rows = 5,
  cols,
}: {
  rows?: number;
  cols: number;
}) {
  return (
    <>
      {Array.from({ length: rows }, (_, row) => (
        <tr key={row}>
          {Array.from({ length: cols }, (_, col) => (
            <td key={col} className="px-5 py-4">
              <div className="h-4 w-full max-w-[140px] animate-pulse rounded bg-slate-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function EmptyRow({
  cols,
  message,
}: {
  cols: number;
  message: string;
}) {
  return (
    <tr>
      <td colSpan={cols} className="px-5 py-16">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <Inbox size={26} />
          </div>
          <p className="text-sm text-slate-500">{message}</p>
        </div>
      </td>
    </tr>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <AlertTriangle size={26} />
      </div>
      <p className="text-sm font-medium text-slate-800">تعذر تحميل البيانات</p>
      <p className="max-w-md text-xs text-slate-500">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-1 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        <RotateCcw size={15} />
        إعادة المحاولة
      </button>
    </div>
  );
}

/* ───────────── Badges + actions ───────────── */

export function StatusBadge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15'
          : 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-amber-500'
        }`}
      />
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

export function Tag({
  children,
  color = 'slate',
}: {
  children: ReactNode;
  color?: 'slate' | 'blue' | 'rose' | 'violet';
}) {
  const colors = {
    slate: 'bg-slate-100 text-slate-700',
    blue: 'bg-blue-50 text-blue-700',
    rose: 'bg-rose-50 text-rose-700',
    violet: 'bg-violet-50 text-violet-700',
  } as const;

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-xs font-medium ${colors[color]}`}
    >
      {children}
    </span>
  );
}

export function RowActions({
  editHref,
  editLabel,
  deleteLabel,
  onDelete,
}: {
  editHref: string;
  editLabel: string;
  deleteLabel: string;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={editHref}
        aria-label={editLabel}
        title="تعديل"
        className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
      >
        <Pencil size={17} />
      </Link>

      <button
        type="button"
        onClick={onDelete}
        aria-label={deleteLabel}
        title="حذف"
        className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={17} />
      </button>
    </div>
  );
}

/* ───────────── Pagination ───────────── */

function getPageNumbers(page: number, pages: number): (number | '...')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const result: (number | '...')[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);

  if (start > 2) result.push('...');
  for (let i = start; i <= end; i++) result.push(i);
  if (end < pages - 1) result.push('...');

  result.push(pages);
  return result;
}

export function Pagination({
  page,
  pages,
  total,
  perPage,
  onChange,
}: {
  page: number;
  pages: number;
  total: number;
  perPage: number;
  onChange: (page: number) => void;
}) {
  if (total === 0) return null;

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-4">
      <p className="text-xs text-slate-500">
        عرض <strong className="text-slate-700">{from}</strong> –{' '}
        <strong className="text-slate-700">{to}</strong> من{' '}
        <strong className="text-slate-700">{total}</strong>
      </p>

      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => onChange(page - 1)}
            aria-label="السابقة"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>

          {getPageNumbers(page, pages).map((item, index) =>
            item === '...' ? (
              <span key={`dots-${index}`} className="px-2 text-slate-400">
                …
              </span>
            ) : (
              <button
                type="button"
                key={item}
                onClick={() => onChange(item)}
                aria-current={page === item ? 'page' : undefined}
                className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition ${
                  page === item
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            disabled={page === pages}
            onClick={() => onChange(page + 1)}
            aria-label="التالية"
            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ───────────── Confirm dialog ───────────── */

export function ConfirmDialog({
  title,
  message,
  error,
  isLoading,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  error?: string;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isLoading) onCancel();
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isLoading, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Trash2 size={22} />
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="إغلاق"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <h2 id="confirm-title" className="mt-4 text-lg font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-7 text-slate-500">{message}</p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"
          >
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
          >
            {isLoading && <LoaderCircle size={16} className="animate-spin" />}
            {isLoading ? 'جارٍ الحذف...' : 'نعم، احذف'}
          </button>
        </div>
      </section>
    </div>
  );
}