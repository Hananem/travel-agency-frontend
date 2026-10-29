import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrentYear } from "@/components/current-year";
import {
  MapPin,
  Star,
  Clock,
  Users,
  Check,
  X,
  ArrowRight,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { trips, included, excluded, formatPrice } from "@/lib/trips";

const BRAND = "#1AA7BC";
const AGENCY = "وكالة الشنة للسفر والسياحة";

export function generateStaticParams() {
  return trips.map((t) => ({ id: t.id }));
}

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const trip = trips.find((t) => t.id === id);
  if (!trip) notFound();

  const related = trips
    .filter((t) => t.id !== trip.id && t.category === trip.category)
    .concat(trips.filter((t) => t.id !== trip.id && t.category !== trip.category))
    .slice(0, 3);

  const program = [
    ...trip.highlights.map((h, i) => ({
      title: `اليوم ${i + 1}`,
      text: h,
    })),
    { title: `اليوم ${trip.highlights.length + 1}`, text: "وقت حر للتسوق ثم التوجه إلى المطار للعودة." },
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4">
        {/* NAVBAR */}
        <nav className="flex items-center justify-between py-5">
          <Link href="/" className="text-lg font-extrabold md:text-xl" style={{ color: BRAND }}>
            {AGENCY}
          </Link>
          <ul className="hidden gap-10 text-sm md:flex">
            <li className="text-muted-foreground"><Link href="/">الرئيسية</Link></li>
            <li className="text-muted-foreground"><a href="#">التذاكر</a></li>
            <li className="font-medium"><Link href="/explore">استكشف</Link></li>
            <li className="text-muted-foreground"><a href="#">الأنشطة</a></li>
          </ul>
          <Button size="sm" className="text-white hover:opacity-90" style={{ backgroundColor: BRAND }}>
            إنشاء حساب
          </Button>
        </nav>

        {/* BREADCRUMB */}
        <div className="mt-4 flex items-center justify-between">
          <Link
            href="/explore"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowRight className="h-3.5 w-3.5" /> العودة إلى جميع الرحلات
          </Link>
          <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <Share2 className="h-3.5 w-3.5" /> مشاركة
          </button>
        </div>

        {/* TITLE */}
        <header className="mt-4">
          <span
            className="rounded-full px-3 py-1 text-[11px] text-white"
            style={{ backgroundColor: BRAND }}
          >
            {trip.category}
          </span>
          <h1 className="mt-3 text-3xl font-bold md:text-4xl">{trip.name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" style={{ color: BRAND }} /> {trip.loc}
            </span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <b className="text-foreground">{trip.rating}</b> ({trip.reviews} تقييم)
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" style={{ color: BRAND }} /> {trip.days} أيام
            </span>
          </div>
        </header>

        {/* HERO IMAGE */}
        <div className="mt-6 h-[300px] overflow-hidden rounded-3xl md:h-[440px]">
          <img src={trip.img} alt={trip.name} className="h-full w-full object-cover" />
        </div>

        {/* CONTENT */}
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <section>
              <h2 className="text-xl font-bold">نبذة عن الرحلة</h2>
              <p className="mt-3 text-sm leading-loose text-muted-foreground">{trip.description}</p>
            </section>

            <section>
              <h2 className="text-xl font-bold">أبرز المحطات</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {trip.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white"
                      style={{ backgroundColor: BRAND }}
                    >
                      <Check className="h-4 w-4" />
                    </span>
                    {h}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold">برنامج الرحلة</h2>
              <ol className="mt-4 space-y-4 border-s-2 border-dashed border-slate-200 ps-6">
                {program.map((d) => (
                  <li key={d.title} className="relative">
                    <span
                      className="absolute -start-[33px] top-1 h-3 w-3 rounded-full ring-4 ring-white"
                      style={{ backgroundColor: BRAND }}
                    />
                    <p className="text-sm font-semibold">{d.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{d.text}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="text-xl font-bold">يشمل السعر</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {included.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="text-xl font-bold">لا يشمل السعر</h2>
                <ul className="mt-4 space-y-3 text-sm">
                  {excluded.map((i) => (
                    <li key={i} className="flex items-start gap-2">
                      <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" /> {i}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* BOOKING CARD */}
          <aside className="h-fit rounded-2xl border bg-white p-5 shadow-lg lg:sticky lg:top-6">
            <p className="text-xs text-muted-foreground">يبدأ السعر من</p>
            <p className="mt-1 text-2xl font-bold" style={{ color: BRAND }}>
              {formatPrice(trip.price)}
              <span className="text-xs font-normal text-muted-foreground"> / للشخص</span>
            </p>

            <div className="mt-5 space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">تاريخ السفر</label>
                <Input type="date" className="h-10 text-sm" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">عدد الأشخاص</label>
                <div className="relative">
                  <Users className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="number" min={1} defaultValue={2} className="h-10 ps-9 text-sm" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">رقم الهاتف</label>
                <Input type="tel" placeholder="0X XX XX XX XX" className="h-10 text-sm" />
              </div>
            </div>

            <Button className="mt-5 w-full text-white hover:opacity-90" style={{ backgroundColor: BRAND }}>
              احجز الآن
            </Button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" /> إلغاء مجاني قبل 7 أيام من السفر
            </p>
          </aside>
        </div>

        {/* RELATED */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold">رحلات قد تعجبك</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((t) => (
              <Link key={t.id} href={`/explore/${t.id}`} className="group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute end-2 top-2 flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium">
                    <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" /> {t.rating}
                  </span>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{t.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" style={{ color: BRAND }} /> {t.loc}
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold">{formatPrice(t.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t py-8 text-center text-xs text-muted-foreground">
          © <CurrentYear /> {AGENCY}. جميع الحقوق محفوظة.
        </footer>
      </div>
    </main>
  );
}