
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

const BRAND = "#1AA7BC";
const AGENCY = "وكالة الشنة للسفر والسياحة";

const footerCols = [
  {
    title: "عن الوكالة",
    links: [
      { label: "من نحن", href: "/about" },
      { label: "المميزات", href: "/#features" },
      { label: "الأخبار", href: "/announcements" },
      { label: "الباقات", href: "/trips" },
    ],
  },
  {
    title: "الشركة",
    links: [
      { label: "لماذا الشنة", href: "/about" },
      { label: "كن شريكًا معنا", href: "/contact" },
      { label: "الأسئلة الشائعة", href: "/faq" },
      { label: "المدونة", href: "/announcements" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { label: "الحساب", href: "/login" },
      { label: "مركز الدعم", href: "/contact" },
      { label: "الملاحظات", href: "/contact" },
      { label: "اتصل بنا", href: "/contact" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      dir="rtl"
      className="mt-28 grid gap-10 pb-12 md:grid-cols-[1.5fr_1fr_1fr_1fr_1.5fr]"
    >
      <div>
        <a
          href="/"
          className="text-lg font-extrabold"
          style={{ color: BRAND }}
        >
          {AGENCY}
        </a>

        <p className="mt-4 max-w-[220px] text-xs leading-relaxed text-muted-foreground">
          نقدم لك أفضل الرحلات والعروض السياحية لتعيش تجربة سفر لا تُنسى.
        </p>
      </div>

      {footerCols.map((column) => (
        <div key={column.title}>
          <h4 className="text-sm font-semibold">
            {column.title}
          </h4>

          <ul className="mt-4 space-y-3 text-xs text-muted-foreground">
            {column.links.map((link) => (
              <li key={link.href + link.label}>
                <a
                  href={link.href}
                  className="hover:opacity-70"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div>
        <h4 className="text-sm font-semibold">
          النشرة البريدية
        </h4>

        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          اشترك في نشرتنا البريدية واحصل على عروض مميزة.
        </p>

        <form className="relative mt-3">
          <Input
            type="email"
            placeholder="أدخل بريدك الإلكتروني"
            aria-label="البريد الإلكتروني"
            className="h-9 pe-10 text-xs"
            required
          />

          <button
            type="submit"
            aria-label="الاشتراك في النشرة البريدية"
            className="absolute end-1 top-1 flex h-7 w-7 items-center justify-center rounded-md text-white"
            style={{ backgroundColor: BRAND }}
          >
            <Send className="h-3.5 w-3.5 -scale-x-100" />
          </button>
        </form>
      </div>
    </footer>
  );
}
