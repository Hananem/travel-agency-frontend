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
  Plus,
} from 'lucide-react';
import { teamService, type TeamMember } from '@/services/team.service';

const PER_PAGE = 6;

export default function TeamPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [position, setPosition] = useState('الكل');
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
    queryKey: ['team'],
    queryFn: teamService.getMembers,
  });

  const members: TeamMember[] = result?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamService.deleteMember(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team'] });
      setDeleteId(null);
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      isPublished,
    }: {
      id: string;
      isPublished: boolean;
    }) => teamService.updateMemberStatus(id, isPublished),

    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['team'] });
      setStatusId(null);
    },
  });

  const positions = useMemo(
    () => [...new Set(members.map((member) => member.position))],
    [members],
  );

  const filtered = useMemo(
    () =>
      members.filter((member) => {
        const matchesSearch = `${member.name} ${member.position}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());

        const memberStatus = member.isPublished ? 'ظاهر' : 'مخفي';

        return (
          matchesSearch &&
          (position === 'الكل' || member.position === position) &&
          (status === 'الكل' || memberStatus === status)
        );
      }),
    [members, search, position, status],
  );

  const pages = Math.ceil(filtered.length / PER_PAGE);
  const currentPage = Math.min(page, Math.max(pages, 1));

  const rows = filtered.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE,
  );

  const selectedMember = members.find((member) => member.id === deleteId);
  const statusMember = members.find((member) => member.id === statusId);

  function confirmDelete() {
    if (deleteId === null || deleteMutation.isPending) return;
    deleteMutation.mutate(deleteId);
  }

  function confirmStatusChange() {
    if (statusMember === undefined || statusMutation.isPending) return;

    statusMutation.mutate({
      id: statusMember.id,
      isPublished: !statusMember.isPublished,
    });
  }

  function resetFilters() {
    setSearch('');
    setPosition('الكل');
    setStatus('الكل');
    setPage(1);
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
            فريق العمل
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-7 text-muted-foreground md:text-base">
            إدارة أعضاء فريق الوكالة ومعلوماتهم.
          </p>
        </div>

        <Link
          href="/admin/team/new"
          className="inline-flex items-center gap-2 bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90"
        >
          <Plus size={18} />
          إضافة عضو
        </Link>
      </header>

      {isLoading && (
        <div className="border-y border-border py-16 text-center text-muted-foreground">
          جارٍ تحميل أعضاء الفريق...
        </div>
      )}

      {isError && (
        <div className="space-y-4 border-y border-border py-10 text-center">
          <p className="text-red-600">
            {error instanceof Error
              ? error.message
              : 'تعذر جلب أعضاء الفريق.'}
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
            <Stat title="جميع الأعضاء" value={members.length} />
            <Stat
              title="الأعضاء الظاهرون"
              value={members.filter((member) => member.isPublished).length}
            />
            <Stat
              title="الأعضاء المخفيون"
              value={members.filter((member) => !member.isPublished).length}
            />
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
                placeholder="البحث عن عضو..."
                className="w-full border border-border bg-white py-3 pr-10 pl-3 text-sm outline-none transition focus:border-primary"
              />
            </div>

            <select
              value={position}
              onChange={(event) => {
                setPosition(event.target.value);
                setPage(1);
              }}
              className="border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary"
            >
              <option value="الكل">جميع المناصب</option>
              {positions.map((item) => (
                <option key={item} value={item}>
                  {item}
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
              <option value="ظاهر">ظاهر</option>
              <option value="مخفي">مخفي</option>
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
                  <th className="px-4 py-4">العضو</th>
                  <th className="px-4 py-4">المنصب</th>
                  <th className="px-4 py-4">الحالة</th>
                  <th className="px-4 py-4">الإجراءات</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((member) => (
                  <tr
                    key={member.id}
                    className="border-b border-border transition hover:bg-muted"
                  >
                    <td className="px-4 py-5">
                      <div className="flex items-center gap-3">
                        {member.imageUrl ? (
                          <img
                            src={member.imageUrl}
                            alt={member.name}
                            className="h-10 w-10 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                            {member.name.charAt(0)}
                          </div>
                        )}

                        <span className="font-bold">{member.name}</span>
                      </div>
                    </td>

                    <td className="px-4 py-5 text-muted-foreground">
                      {member.position}
                    </td>

                    <td className="px-4 py-5">
                      <span className="inline-flex items-center gap-2 text-xs font-semibold">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            member.isPublished
                              ? 'bg-green-600'
                              : 'bg-amber-500'
                          }`}
                        />
                        {member.isPublished ? 'ظاهر' : 'مخفي'}
                      </span>
                    </td>

                    <td className="px-4 py-5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/team/${member.id}/edit`}
                          aria-label="تعديل العضو"
                          title="تعديل"
                          className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <Pencil size={17} />
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            statusMutation.reset();
                            setStatusId(member.id);
                          }}
                          aria-label={
                            member.isPublished ? 'إخفاء العضو' : 'نشر العضو'
                          }
                          title={
                            member.isPublished ? 'إلغاء النشر' : 'نشر'
                          }
                          className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
                        >
                          <RefreshCw size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteId(member.id)}
                          aria-label="حذف العضو"
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
                      colSpan={4}
                      className="px-4 py-16 text-center text-muted-foreground"
                    >
                      لا يوجد أعضاء مطابقون.
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
          title="حذف عضو الفريق"
          message={`هل أنتِ متأكدة من حذف «${selectedMember?.name ?? ''}» من فريق العمل؟ لا يمكن التراجع عن هذا الإجراء.`}
          isDeleting={deleteMutation.isPending}
          error={
            deleteMutation.isError
              ? deleteMutation.error instanceof Error
                ? deleteMutation.error.message
                : 'تعذر حذف العضو.'
              : ''
          }
          onCancel={() => setDeleteId(null)}
          onConfirm={confirmDelete}
        />
      )}

      {statusId !== null && statusMember && (
        <StatusModal
          member={statusMember}
          isPending={statusMutation.isPending}
          error={
            statusMutation.isError
              ? statusMutation.error instanceof Error
                ? statusMutation.error.message
                : 'تعذر تغيير حالة النشر.'
              : ''
          }
          onCancel={() => {
            if (!statusMutation.isPending) {
              setStatusId(null);
              statusMutation.reset();
            }
          }}
          onConfirm={confirmStatusChange}
        />
      )}
    </main>
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
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
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

function StatusModal({
  member,
  isPending,
  error,
  onCancel,
  onConfirm,
}: {
  member: TeamMember;
  isPending: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const willPublish = !member.isPublished;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onCancel();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-modal-title"
        className="w-full max-w-md bg-white p-8 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <span className="flex h-12 w-12 items-center justify-center border border-primary/40 text-primary">
            <RefreshCw size={21} />
          </span>

          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            aria-label="إغلاق"
            className="flex h-10 w-10 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        <h2
          id="status-modal-title"
          className="mt-6 text-xl font-extrabold tracking-tight"
        >
          {willPublish ? 'نشر عضو الفريق' : 'إلغاء نشر عضو الفريق'}
        </h2>

        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          {willPublish
            ? `هل تريد نشر «${member.name}» ليظهر ضمن فريق العمل على الموقع؟`
            : `هل تريد إخفاء «${member.name}» من الموقع العام؟ سيبقى العضو محفوظًا في لوحة الإدارة.`}
        </p>

        <div className="mt-5 border-y border-border py-3 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">الحالة الحالية</span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold">
              <span
                className={`h-2 w-2 rounded-full ${
                  member.isPublished ? 'bg-green-600' : 'bg-amber-500'
                }`}
              />
              {member.isPublished ? 'ظاهر' : 'مخفي'}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-muted-foreground">الحالة بعد التغيير</span>
            <span className="inline-flex items-center gap-2 text-xs font-semibold">
              <span
                className={`h-2 w-2 rounded-full ${
                  willPublish ? 'bg-green-600' : 'bg-amber-500'
                }`}
              />
              {willPublish ? 'ظاهر' : 'مخفي'}
            </span>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-start gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending
              ? 'جارٍ تحديث الحالة...'
              : willPublish
                ? 'نعم، انشر'
                : 'نعم، أخفِ العضو'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="border border-border px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-40"
          >
            إلغاء
          </button>
        </div>
      </section>
    </div>
  );
}