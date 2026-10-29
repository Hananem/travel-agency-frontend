"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  MapPin,
  Plane,
  RefreshCw,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { bookingsService } from "@/services/bookings.service";

const tripImages = ["/trip1.jpg", "/trip2.jpg", "/trip3.jpg"];

type TripCompanion = {
  role?: string | null;
  teamMember: {
    id: string;
    name: string;
    position?: string | null;
    imageUrl?: string | null;
  };
};

type Trip = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  image?: string | null;
  images?: string[] | null;
  destination?: string | { name?: string; country?: string };
  destinationName?: string;
  country?: string;
  price?: number | string | null;
  pricePerPerson?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  duration?: number | string | null;
  capacity?: number | null;
  bookedSeats?: number;
  remainingSeats?: number | null;
  isFull?: boolean;
  features?: string[] | null;
  companions?: TripCompanion[] | null;
  status?: string;
  isPublished?: boolean;
  createdAt?: string | null;
};

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (response.status === 404) {
    throw new Error("NOT_FOUND");
  }

  if (!response.ok) {
    throw new Error("تعذر تحميل البيانات");
  }

  return response.json();
}

function getItems<T>(response: unknown): T[] {
  if (Array.isArray(response)) {
    return response as T[];
  }

  if (response && typeof response === "object") {
    const result = response as { data?: unknown; items?: unknown };

    if (Array.isArray(result.data)) {
      return result.data as T[];
    }

    if (Array.isArray(result.items)) {
      return result.items as T[];
    }
  }

  return [];
}

// The API may return the trip directly or wrapped in { data: trip }
function getItem(response: unknown): Trip | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const result = response as { data?: unknown; id?: unknown };

  if (
    result.data &&
    typeof result.data === "object" &&
    !Array.isArray(result.data)
  ) {
    return result.data as Trip;
  }

  if (result.id) {
    return response as Trip;
  }

  return null;
}

function getTripName(trip: Trip) {
  return trip.name || trip.title || "رحلة سياحية";
}

function getTripDestination(trip: Trip) {
  if (typeof trip.destination === "string") {
    return trip.destination;
  }

  return (
    trip.destination?.name ||
    trip.destinationName ||
    trip.destination?.country ||
    trip.country ||
    "وجهة سياحية"
  );
}

// Shows the price exactly as it comes from the API
function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

// التاريخ والساعة بتوقيت الجزائر بغض النظر عن توقيت جهاز الزائر
function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString("ar-DZ", {
    timeZone: "Africa/Algiers",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 pt-10 md:pt-14">
      <div className="h-4 w-24 bg-muted" />

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="h-[420px] bg-muted md:h-[680px]" />

        <div className="space-y-5">
          <div className="h-4 w-1/4 bg-muted" />
          <div className="h-10 w-3/4 bg-muted" />
          <div className="h-6 w-1/3 bg-muted" />
          <div className="h-4 w-full bg-muted" />
          <div className="h-4 w-full bg-muted" />
          <div className="h-4 w-2/3 bg-muted" />
        </div>
      </div>
    </div>
  );
}

const PHONE_PATTERN = /^[0-9+\s()-]{8,20}$/;

function BookingModal({
  tripId,
  tripName,
  maxCompanions,
  onClose,
}: {
  tripId: string;
  tripName: string;
  maxCompanions: number;
  onClose: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companionsCount, setCompanionsCount] = useState("0");
  const [note, setNote] = useState("");
  const [validationError, setValidationError] = useState("");

  const bookingMutation = useMutation({
    mutationFn: () =>
      bookingsService.createBooking({
        tripId,
        fullName: fullName.trim(),
        phone: phone.trim(),
        companionsCount: Math.max(0, Number(companionsCount) || 0),
        note: note.trim() || undefined,
      }),
  });

  const isPending = bookingMutation.isPending;
  const isSuccess = bookingMutation.isSuccess;

  // Close with Escape and lock page scroll while the modal is open
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isPending) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isPending, onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setValidationError("");

    if (!fullName.trim()) {
      setValidationError("يرجى إدخال الاسم الكامل.");
      return;
    }

    if (!PHONE_PATTERN.test(phone.trim())) {
      setValidationError("رقم الهاتف غير صالح.");
      return;
    }

    if ((Number(companionsCount) || 0) > maxCompanions) {
      setValidationError(
        `أقصى عدد للمرافقين المتاح حالياً هو ${maxCompanions}.`,
      );
      return;
    }

    bookingMutation.mutate();
  }

  const inputClass =
    "w-full border border-border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-primary disabled:bg-muted";
  const labelClass = "mb-1.5 block text-sm font-bold";

  const errorMessage =
    validationError ||
    (bookingMutation.isError ? getErrorMessage(bookingMutation.error) : "");

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:items-center sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isPending) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="my-3 w-full max-w-lg bg-white text-neutral-900 shadow-xl"
      >
        {isSuccess ? (
          <div className="p-8 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />

            <h2
              id="booking-modal-title"
              className="mt-5 text-xl font-extrabold tracking-tight"
            >
              تم استلام طلب الحجز
            </h2>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              شكرًا {fullName.trim()}، وصلنا طلبك لرحلة «{tripName}». سنتواصل
              معك قريبًا على الرقم {phone.trim()} لتأكيد الحجز.
            </p>

            <button
              type="button"
              onClick={onClose}
              className="mt-8 bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-6">
              <div>
                <span className="text-sm font-semibold text-primary">
                  حجز رحلة
                </span>

                <h2
                  id="booking-modal-title"
                  className="mt-2 text-xl font-extrabold tracking-tight"
                >
                  {tripName}
                </h2>

                <p className="mt-2 text-sm text-muted-foreground">
                  املأ البيانات التالية وسنتواصل معك لتأكيد الحجز.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                aria-label="إغلاق"
                className="flex h-10 w-10 shrink-0 items-center justify-center border border-border text-muted-foreground transition hover:border-primary hover:text-primary disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[calc(100dvh-240px)] space-y-5 overflow-y-auto p-6">
                <div>
                  <label htmlFor="booking-name" className={labelClass}>
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="booking-name"
                    type="text"
                    required
                    maxLength={100}
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="الاسم واللقب"
                    disabled={isPending}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="booking-phone" className={labelClass}>
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="booking-phone"
                      type="tel"
                      inputMode="tel"
                      dir="ltr"
                      required
                      maxLength={20}
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="05 55 00 00 00"
                      disabled={isPending}
                      className={`${inputClass} text-right`}
                    />
                  </div>

                  <div>
                    <label htmlFor="booking-companions" className={labelClass}>
                      عدد المرافقين
                    </label>
                    <input
                      id="booking-companions"
                      type="number"
                      min={0}
                      max={maxCompanions}
                      step={1}
                      value={companionsCount}
                      onChange={(event) =>
                        setCompanionsCount(event.target.value)
                      }
                      disabled={isPending}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="booking-note" className={labelClass}>
                    ملاحظة (اختياري)
                  </label>
                  <textarea
                    id="booking-note"
                    rows={3}
                    maxLength={1000}
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="أي طلب أو تفصيل تريد إخبارنا به..."
                    disabled={isPending}
                    className={`${inputClass} resize-y`}
                  />
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="border border-red-600/40 p-3 text-sm text-red-600"
                  >
                    {errorMessage}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 border-t border-border px-6 py-5 sm:flex-row">
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}
                  {isPending ? "جارٍ الإرسال..." : "تأكيد الحجز"}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isPending}
                  className="border border-border px-8 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </>
        )}
      </section>
    </div>
  );
}

function TripDetailsContent() {
  const params = useParams<{ slug: string }>();
  const slug = decodeURIComponent(params.slug);

  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const tripQuery = useQuery({
    queryKey: ["trips", "detail", slug],
    queryFn: () => fetchApi<unknown>(`/api/trips/${encodeURIComponent(slug)}`),
    retry: (count, error) => error.message !== "NOT_FOUND" && count < 2,
  });

  // Shares the same cache key as the trips list page
  const allTripsQuery = useQuery({
    queryKey: ["trips", "all"],
    queryFn: () => fetchApi<unknown>("/api/trips"),
  });

  const trip = useMemo(() => getItem(tripQuery.data), [tripQuery.data]);

  const relatedTrips = useMemo(() => {
    if (!trip) {
      return [];
    }

    const destination = getTripDestination(trip);

    return getItems<Trip>(allTripsQuery.data)
      .filter(
        (item) =>
          item.id !== trip.id &&
          item.isPublished !== false &&
          getTripDestination(item) === destination,
      )
      .slice(0, 4);
  }, [allTripsQuery.data, trip]);

  if (tripQuery.isLoading) {
    return (
      <main dir="rtl" className="min-h-screen bg-white text-neutral-900">
        <LoadingState />
      </main>
    );
  }

  if (tripQuery.isError || !trip) {
    const notFound = tripQuery.isError
      ? tripQuery.error?.message === "NOT_FOUND"
      : !trip;

    return (
      <main dir="rtl" className="min-h-screen bg-white text-neutral-900">
        <section className="mx-auto max-w-7xl px-5 py-24 text-center">
          <Plane className="mx-auto h-8 w-8 text-primary" />

          <h1 className="mt-4 text-2xl font-bold">
            {notFound ? "الرحلة غير موجودة" : "تعذر تحميل الرحلة حاليًا"}
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            {notFound
              ? "قد تكون الرحلة غير متاحة أو تم حذفها."
              : "حدث خطأ أثناء تحميل البيانات، حاول مرة أخرى."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {!notFound && (
              <button
                type="button"
                onClick={() => tripQuery.refetch()}
                className="bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
              >
                إعادة المحاولة
              </button>
            )}

            <Link
              href="/trips"
              className="inline-flex border border-primary px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
            >
              العودة إلى الرحلات
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const name = getTripName(trip);
  const destination = getTripDestination(trip);
  const price = formatPrice(trip.pricePerPerson ?? trip.price);
  const startDate = formatDateTime(trip.startDate);
  const endDate = formatDateTime(trip.endDate);

  const features = (trip.features ?? []).filter(Boolean);
  const companions = (trip.companions ?? []).filter((c) => c.teamMember);

  const hasStarted = trip.startDate
    ? new Date(trip.startDate).getTime() < Date.now()
    : false;
  const isFull = trip.isFull === true;
  const canBook = !isFull && !hasStarted;

  const remaining = trip.remainingSeats;
  const hasLimitedSeats =
    remaining !== null && remaining !== undefined && trip.capacity;

  // أقصى مرافقين = المقاعد المتبقية - 1 (الحاجز نفسه)
  const maxCompanions = hasLimitedSeats
    ? Math.max((remaining as number) - 1, 0)
    : 50;

  const gallery = [
    trip.imageUrl || trip.image || tripImages[0],
    ...(trip.images ?? []),
  ].filter((src, index, list) => src && list.indexOf(src) === index);

  const details = [
    { icon: MapPin, label: "الوجهة", value: destination },
    trip.duration
      ? { icon: Clock, label: "المدة", value: String(trip.duration) }
      : null,
    startDate
      ? { icon: CalendarDays, label: "الانطلاق", value: startDate }
      : null,
    endDate ? { icon: CalendarDays, label: "العودة", value: endDate } : null,
    hasLimitedSeats
      ? {
          icon: Users,
          label: "المقاعد",
          value: isFull
            ? "مكتملة"
            : `${remaining} متبقية من ${trip.capacity}`,
        }
      : null,
  ].filter(Boolean) as {
    icon: typeof MapPin;
    label: string;
    value: string;
  }[];

  return (
    <main dir="rtl" className="overflow-hidden bg-white text-neutral-900">
      {/* Back link */}
      <section className="mx-auto max-w-7xl px-5 pt-10 md:pt-14">
        <Link
          href="/trips"
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:opacity-75"
        >
          <ArrowRight className="h-4 w-4" />
          جميع الرحلات
        </Link>
      </section>

      {/* Trip overview */}
      <section className="mx-auto mt-8 max-w-7xl px-5">
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Images */}
          <div>
            <div className="overflow-hidden bg-muted">
              <img
                src={gallery[0]}
                alt={name}
                width={800}
                height={600}
                className="h-[420px] w-full object-cover md:h-[680px]"
              />
            </div>

            {gallery.length > 1 && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                {gallery.slice(1, 4).map((src, index) => (
                  <div key={src} className="overflow-hidden bg-muted">
                    <img
                      src={src}
                      alt={`${name} - ${index + 2}`}
                      loading="lazy"
                      className="h-24 w-full object-cover md:h-32"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="mb-3 text-sm font-semibold text-primary">
              {destination}
            </p>

            <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
              {name}
            </h1>

            {price !== null && (
              <p className="mt-6 text-2xl font-bold text-primary">
                {price} دج
              </p>
            )}

            {trip.description && (
              <p className="mt-5 whitespace-pre-line text-sm leading-8 text-muted-foreground md:text-base">
                {trip.description}
              </p>
            )}

            {details.length > 0 && (
              <dl className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {details.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3">
                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

                    <div>
                      <dt className="text-xs text-muted-foreground">
                        {label}
                      </dt>
                      <dd className="mt-1 text-sm font-bold">{value}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            )}

            {/* Features */}
            {features.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold">مميزات الرحلة</h2>

                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Companions */}
            {companions.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-4 text-lg font-bold">
                  يرافقكم في الرحلة
                </h2>

                <ul className="space-y-3">
                  {companions.map(({ teamMember, role }) => (
                    <li
                      key={teamMember.id}
                      className="flex items-center gap-3"
                    >
                      {teamMember.imageUrl ? (
                        <img
                          src={teamMember.imageUrl}
                          alt={teamMember.name}
                          loading="lazy"
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border text-primary">
                          <UserRound className="h-5 w-5" />
                        </span>
                      )}

                      <div>
                        <p className="text-sm font-bold">{teamMember.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {role || teamMember.position}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsBookingOpen(true)}
                disabled={!canBook}
                className="inline-flex bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isFull
                  ? "المقاعد مكتملة"
                  : hasStarted
                    ? "انطلقت الرحلة"
                    : "احجز هذه الرحلة"}
              </button>

              <Link
                href={`/contact?trip=${encodeURIComponent(name)}`}
                className="inline-flex border border-primary px-8 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
              >
                استفسر عن الرحلة
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related trips */}
      {relatedTrips.length > 0 && (
        <section className="mx-auto mb-28 mt-16 max-w-7xl px-5">
          <p className="mb-2 text-sm font-semibold text-primary">
            قد يعجبك أيضًا
          </p>

          <h2 className="text-2xl font-bold md:text-3xl">
            رحلات أخرى إلى {destination}
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {relatedTrips.map((item, index) => {
              const href = `/trips/${item.slug || item.id}`;
              const itemPrice = formatPrice(item.pricePerPerson ?? item.price);

              return (
                <Link
                  key={item.id}
                  href={href}
                  aria-label={`عرض الرحلة: ${getTripName(item)}`}
                  className="group block min-w-0 overflow-hidden"
                >
                  <article>
                    <div className="relative overflow-hidden">
                      <img
                        src={
                          item.imageUrl ||
                          item.image ||
                          tripImages[index % tripImages.length]
                        }
                        alt={getTripName(item)}
                        loading="lazy"
                        width={300}
                        height={420}
                        className="h-[280px] w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-[380px]"
                      />

                      <span className="absolute right-3 top-3 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                        {item.isFull ? "مكتملة" : "رحلة سياحية"}
                      </span>
                    </div>

                    <div className="pt-4">
                      <p className="text-xs text-muted-foreground">
                        {getTripDestination(item)}
                      </p>

                      <h3 className="mt-2 text-base font-bold transition group-hover:text-primary md:text-lg">
                        {getTripName(item)}
                      </h3>

                      {itemPrice !== null && (
                        <p className="mt-3 font-bold text-primary">
                          {itemPrice} دج
                        </p>
                      )}
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {relatedTrips.length === 0 && <div className="mb-28" />}

      {isBookingOpen && canBook && (
        <BookingModal
          tripId={trip.id}
          tripName={name}
          maxCompanions={maxCompanions}
          onClose={() => setIsBookingOpen(false)}
        />
      )}
    </main>
  );
}

export default function TripDetailsPage() {
  return (
    <Suspense
      fallback={
        <main dir="rtl" className="min-h-screen bg-white text-neutral-900">
          <LoadingState />
        </main>
      }
    >
      <TripDetailsContent />
    </Suspense>
  );
}