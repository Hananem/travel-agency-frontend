"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft, Plane } from "lucide-react";

const tripImages = ["/trip1.jpg", "/trip2.jpg", "/trip3.jpg"];

const destinationImages = [
  "/destination1.jpg",
  "/destination2.jpg",
  "/destination3.jpg",
  "/destination4.jpg",
];

type Destination = {
  id: string;
  name: string;
  slug: string;
  country: string;
  description: string;
  imageUrl?: string | null;
  isPublished: boolean;
};

type Trip = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  description?: string;
  imageUrl?: string | null;
  image?: string | null;
  destination?: string | { name?: string; country?: string };
  destinationName?: string;
  country?: string;
  price?: number | string | null;
  pricePerPerson?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  duration?: number | string | null;
  status?: string;
  isPublished?: boolean;
};

async function fetchApi<T>(url: string): Promise<T> {
  const response = await fetch(url);

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
    const result = response as {
      data?: unknown;
      items?: unknown;
    };

    if (Array.isArray(result.data)) {
      return result.data as T[];
    }

    if (Array.isArray(result.items)) {
      return result.items as T[];
    }
  }

  return [];
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

// Shows the price exactly as it comes from the API (no Number / Intl formatting)
function formatPrice(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return String(value);
}

function SectionHeading({
  title,
  description,
  center = false,
}: {
  title: string;
  description?: string;
  center?: boolean;
}) {
  return (
    <div
      className={`mb-12 flex flex-col gap-3 ${
        center
          ? "items-center text-center"
          : "md:flex-row md:items-end md:justify-between"
      }`}
    >
      <div>
        <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
          {title}
        </h2>

        {description && (
          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function LoadingCards() {
  return (
    <div className="grid w-full grid-cols-2 gap-5 md:grid-cols-4">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="min-w-0 animate-pulse">
          <div className="h-[280px] bg-muted md:h-[380px]" />
          <div className="space-y-3 py-4">
            <div className="h-4 w-1/2 bg-muted" />
            <div className="h-5 w-3/4 bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Popular destinations */
function DestinationSlider({
  destinations,
}: {
  destinations: Destination[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = destinations.length;

  if (count === 0) {
    return null;
  }

  function moveSlider(direction: number) {
    const nextIndex = (activeIndex + direction + count) % count;

    setActiveIndex(nextIndex);

    const container = document.getElementById("destination-slider");
    const target = container?.children[nextIndex] as
      | HTMLElement
      | undefined;

    target?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
  }

  return (
    <div className="w-full min-w-0">
      <div
        id="destination-slider"
        className="flex w-full flex-nowrap gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {destinations.map((destination, index) => (
          <Link
            key={destination.id}
            href={`/destinations/${destination.slug}`}
            onMouseEnter={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            className="group relative block min-w-0 flex-[0_0_30%] overflow-hidden"
          >
            <img
              src={
                destination.imageUrl ||
                destinationImages[index % destinationImages.length]
              }
              alt={destination.name}
              loading="lazy"
              width={300}
              height={420}
              className="h-[240px] w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-[320px]"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-2 text-white md:p-3">
              <p className="text-xs text-white/80">
                {destination.country}
              </p>

              <h3 className="mt-1 text-sm font-bold md:text-base">
                {destination.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">
            {String(activeIndex + 1).padStart(2, "0")}
          </span>
          {" / "}
          {String(count).padStart(2, "0")}
          <span className="mr-2">
            {destinations[activeIndex]?.name}
          </span>
        </p>

        <div className="flex shrink-0 gap-2" dir="ltr">
          <button
            type="button"
            onClick={() => moveSlider(-1)}
            aria-label="الوجهة السابقة"
            className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => moveSlider(1)}
            aria-label="الوجهة التالية"
            className="flex h-10 w-10 items-center justify-center border border-border transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const destinationsQuery = useQuery({
    queryKey: ["home", "destinations"],
    queryFn: () => fetchApi<unknown>("/api/destinations"),
  });

  const tripsQuery = useQuery({
    queryKey: ["home", "trips"],
    queryFn: () => fetchApi<unknown>("/api/trips"),
  });

  const destinations = getItems<Destination>(
    destinationsQuery.data,
  ).filter((destination) => destination.isPublished !== false);

  const trips = getItems<Trip>(tripsQuery.data).filter(
    (trip) =>
      trip.isPublished !== false &&
      (!trip.status ||
        ["published", "active", "available"].includes(
          trip.status.toLowerCase(),
        )),
  );

  const latestTrips = trips.slice(-4).reverse();

  // Console logs for trips (runs only when the trips data changes)
  useEffect(() => {
    if (tripsQuery.isLoading) {
      console.log("[Trips] جاري التحميل...");
      return;
    }

    if (tripsQuery.isError) {
      console.error("[Trips] خطأ في التحميل:", tripsQuery.error);
      return;
    }

    console.log("[Trips] الرد الخام من الـ API:", tripsQuery.data);
    console.log("[Trips] جميع الرحلات:", getItems<Trip>(tripsQuery.data));
    console.log("[Trips] الرحلات المنشورة بعد الفلترة:", trips);
    console.log("[Trips] آخر 4 رحلات المعروضة:", latestTrips);
    console.table(
      latestTrips.map((trip) => ({
        id: trip.id,
        name: getTripName(trip),
        destination: getTripDestination(trip),
        price: trip.pricePerPerson ?? trip.price,
        status: trip.status,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripsQuery.data, tripsQuery.isLoading, tripsQuery.isError]);

  return (
    <main dir="rtl" className="overflow-hidden bg-white text-neutral-900">
      {/* Hero */}
      <section className="mx-auto flex max-w-7xl flex-col px-5 pb-6 pt-6 md:pt-8">
        {/* Text centered, outside the image */}
        <div className="mx-auto flex max-w-5xl shrink-0 flex-col items-center text-center">
          <p className="mb-3 border border-border bg-muted px-5 py-1.5 text-sm text-muted-foreground">
            وكالة أفق للسفر والسياحة
          </p>

          <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-[clamp(2.75rem,7.5vh,5.5rem)] md:leading-[1.1]">
            اكتشف العالم
            <br />
            واستمتع بجماله
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
            اكتشف وجهات جديدة، وتعرّف على رحلاتنا السياحية، واستعد لخوض
            تجربة سفر مختلفة.
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/trips"
              className="bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg transition hover:-translate-y-1 hover:opacity-90"
            >
              استكشف الرحلات
            </Link>

            <Link
              href="/contact"
              className="border border-border px-8 py-3 font-semibold transition hover:border-primary hover:bg-primary hover:text-primary-foreground"
            >
              تواصل معنا
            </Link>
          </div>
        </div>

        {/* Large, tall image centered */}
        <div className="mx-auto mt-5 h-[240px] w-full max-w-7xl md:h-[300px] overflow-hidden shadow-xl">
          <img
            src="/hero1.jpg"
            alt="مناظر طبيعية خلابة"
            width={1600}
            height={900}
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* About agency and statistics */}
      <section className="mx-auto mt-28 max-w-7xl px-5 md:mt-32">
        <div className="grid gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-4xl">
              عن الوكالة
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-8 text-muted-foreground md:text-base">
              نرافقك في اكتشاف وجهات جديدة واختيار الرحلات التي تناسب تطلعاتك،
              مع توفير معلومات واضحة حول البرامج السياحية وتفاصيل السفر لتخطط
              لرحلتك القادمة بكل سهولة.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8">
            <div className="border-b border-border pb-5">
              <p className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                200+
              </p>
              <h3 className="mt-2 text-sm font-bold md:text-base">
                رحلة سياحية
              </h3>
              <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm">
                برامج وتجارب سفر متنوعة
              </p>
            </div>

            <div className="border-b border-border pb-5">
              <p className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                20+
              </p>
              <h3 className="mt-2 text-sm font-bold md:text-base">
                وجهة سياحية
              </h3>
              <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm">
                أماكن لاكتشافها حول العالم
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                500+
              </p>
              <h3 className="mt-2 text-sm font-bold md:text-base">
                مسافر
              </h3>
              <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm">
                خاضوا تجارب سفر مميزة
              </p>
            </div>

            <div>
              <p className="text-3xl font-extrabold tracking-tight text-foreground md:text-5xl">
                98%
              </p>
              <h3 className="mt-2 text-sm font-bold md:text-base">
                رضا العملاء
              </h3>
              <p className="mt-1 text-xs leading-6 text-muted-foreground md:text-sm">
                نسعى لتقديم تجربة سفر مريحة
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular destinations */}
      <section className="mx-auto mt-32 max-w-7xl px-5 md:mt-40">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.5fr] lg:items-center lg:gap-12">
          <div className="flex flex-col items-start">
            <p className="mb-4 text-sm font-semibold text-primary">
              اكتشف العالم
            </p>

            <h2 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              وجهات تستحق
              <br />
              الاكتشاف
            </h2>

            <p className="mt-5 max-w-md text-sm leading-8 text-muted-foreground md:text-base">
              من المدن النابضة بالحياة إلى الشواطئ الساحرة،
              اكتشف أماكن جديدة واجعل رحلتك القادمة تجربة لا تُنسى.
            </p>

            <Link
              href="/destinations"
              className="mt-7 inline-flex items-center gap-3 border-b border-primary pb-2 text-sm font-bold transition hover:text-primary"
            >
              اكتشف جميع الوجهات
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          <div className="min-w-0">
            {destinationsQuery.isLoading ? (
              <LoadingCards />
            ) : destinationsQuery.isError ? (
              <div className="w-full py-10 text-center">
                <p className="font-semibold">
                  تعذر تحميل الوجهات حاليًا.
                </p>

                <button
                  onClick={() => destinationsQuery.refetch()}
                  className="mt-4 text-sm font-semibold text-primary"
                >
                  إعادة المحاولة
                </button>
              </div>
            ) : destinations.length === 0 ? (
              <div className="w-full py-10 text-center text-muted-foreground">
                لا توجد وجهات منشورة حاليًا.
              </div>
            ) : (
              <DestinationSlider destinations={destinations} />
            )}
          </div>
        </div>
      </section>

      {/* Features: three flex columns side by side (title | image | points) */}
      <section className="mx-auto mt-32 max-w-7xl px-5 md:mt-40">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:gap-10">
          {/* 1) Title */}
          <div className="lg:w-[31%]">
            <h2 className="text-2xl font-bold leading-snug tracking-tight md:text-4xl">
              سافر لتصنع ذكريات جميلة
            </h2>

            <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
              نجعل الوصول إلى وجهتك القادمة والتعرّف على رحلاتنا أسهل.
            </p>

            <Link
              href="/destinations"
              className="mt-7 inline-flex items-center gap-2 bg-primary px-7 py-3 font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:opacity-90"
            >
              استكشف الوجهات
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>

          {/* 2) Image (slightly wider) */}
          <div className="lg:w-[30%]">
            <img
              src="/img1.jpg"
              alt="وجهة سياحية مميزة"
              loading="lazy"
              width={1200}
              height={800}
              className="h-[400px] w-full object-cover shadow-xl md:h-[600px]"
            />
          </div>

          {/* 3) Points stacked vertically */}
          <div className="space-y-8 lg:w-[31%]">
            {[
              {
                title: "وجهات تناسب تطلعاتك",
                description:
                  "اكتشف أماكن مختلفة وتعرّف على الوجهات التي تناسب خطط سفرك.",
              },
              {
                title: "رحلات ومعلومات واضحة",
                description:
                  "تصفّح الرحلات المنشورة واطّلع على تفاصيلها وأسعارها المتاحة.",
              },
              {
                title: "تواصل مباشر مع الوكالة",
                description:
                  "نساعدك في الاستفسار عن برامج السفر والتخطيط لرحلتك القادمة.",
              },
            ].map((feature) => (
              <div key={feature.title}>
                <h3 className="text-lg font-bold md:text-xl">
                  {feature.title}
                </h3>

                <p className="mt-2 text-sm leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest four trips */}
      <section className="mx-auto mt-32 max-w-7xl px-5 md:mt-40">
        <SectionHeading
          title="آخر الرحلات"
          description="تعرّف على الرحلات المنشورة واختر التجربة التي تناسبك."
        />

        {tripsQuery.isLoading ? (
          <LoadingCards />
        ) : tripsQuery.isError ? (
          <div className="p-8 text-center">
            <p className="font-semibold">تعذر تحميل الرحلات حاليًا.</p>

            <button
              onClick={() => tripsQuery.refetch()}
              className="mt-4 bg-primary px-5 py-2 text-sm text-primary-foreground"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : trips.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Plane className="mx-auto h-8 w-8 text-primary" />

            <h3 className="mt-4 text-lg font-bold">رحلاتنا قريبًا</h3>

            <p className="mt-2 text-sm text-muted-foreground">
              لا توجد رحلات منشورة حاليًا. تواصل معنا للاستفسار عن برامج السفر.
            </p>

            <Link
              href="/contact"
              className="mt-5 inline-flex bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
            >
              تواصل معنا
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {latestTrips.map((trip, index) => {
              const price = formatPrice(
                trip.pricePerPerson ?? trip.price,
              );

              return (
                <article
                  key={trip.id}
                  className="group min-w-0 overflow-hidden"
                >
                  <Link
                    href="/trips"
                    aria-label={`عرض الرحلات: ${getTripName(trip)}`}
                    className="relative block overflow-hidden"
                  >
                    <img
                      src={
                        trip.imageUrl ||
                        trip.image ||
                        tripImages[index % tripImages.length]
                      }
                      alt={getTripName(trip)}
                      loading="lazy"
                      width={300}
                      height={420}
                      className="h-[280px] w-full object-cover transition-transform duration-500 group-hover:scale-105 md:h-[380px]"
                    />

                    <span className="absolute right-3 top-3 bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                      رحلة سياحية
                    </span>
                  </Link>

                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground">
                      {getTripDestination(trip)}
                    </p>

                    <h3 className="mt-2 text-base font-bold md:text-lg">
                      {getTripName(trip)}
                    </h3>

                    {price !== null && (
                      <p className="mt-3 font-bold text-primary">
                        {price} دج
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link
            href="/trips"
            className="inline-flex items-center gap-2 px-7 py-3 font-semibold transition hover:text-primary"
          >
            عرض جميع الرحلات
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Why us */}
      <section className="mx-auto mt-32 max-w-7xl px-5 md:mt-40">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <h2 className="text-2xl font-extrabold leading-snug tracking-tight md:text-4xl">
              لماذا تختار
              <br />
              وكالة أفق؟
            </h2>

            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground md:text-base">
              كل ما تحتاج إليه للتعرّف على خيارات السفر والتواصل مع الوكالة،
              في مكان واحد وبكل وضوح.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <img
                src="/destination1.jpg"
                alt="وجهة سياحية"
                loading="lazy"
                width={600}
                height={800}
                className="aspect-[3/4] w-full object-cover shadow-md"
              />

              <img
                src="/destination3.jpg"
                alt="رحلة سياحية"
                loading="lazy"
                width={600}
                height={800}
                className="mt-8 aspect-[3/4] w-full object-cover shadow-md"
              />
            </div>
          </div>

          <div className="border-t border-border">
            {[
              {
                title: "خيارات متنوعة",
                text: "تعرّف على الوجهات والبرامج السياحية المنشورة في مكان واحد.",
                href: "/destinations",
              },
              {
                title: "معلومات واضحة",
                text: "اطّلع على تفاصيل الرحلات والأسعار المتاحة قبل الاستفسار.",
                href: "/trips",
              },
              {
                title: "تواصل مباشر",
                text: "تواصل مع الوكالة للحصول على المعلومات اللازمة لتخطيط رحلتك.",
                href: "/contact",
              },
            ].map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="group flex items-center justify-between gap-6 border-b border-border py-8"
              >
                <div>
                  <h3 className="text-lg font-bold tracking-wide md:text-xl">
                    {item.title}
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-7 text-muted-foreground">
                    {item.text}
                  </p>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-primary/40 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <ArrowLeft className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="mx-auto mb-32 mt-32 max-w-7xl px-5 md:mt-40">
        <div className="relative overflow-hidden shadow-xl">
          <video
            src="/video.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="h-72 w-full object-cover md:h-96"
          />

          <div className="absolute inset-0 bg-black/50" />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center text-white">
            <p className="text-sm font-semibold text-white/80">
              وكالة أفق للسفر والسياحة
            </p>

            <h2 className="max-w-3xl text-3xl leading-tight font-extrabold md:text-5xl">
              رحلتك القادمة تبدأ بخطوة
            </h2>

            <p className="max-w-xl text-sm leading-7 text-white/85 md:text-base">
              تواصل معنا للاستفسار عن الرحلات والوجهات والبرامج السياحية المتاحة.
            </p>

            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg transition hover:-translate-y-1 hover:opacity-90"
            >
              تواصل مع الوكالة
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}