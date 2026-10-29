const BRAND = "#1AA7BC";
const AGENCY = "وكالة الشنة للسفر والسياحة";

const navLinks = [
  { label: "الرئيسية", href: "/" },
  { label: "من نحن", href: "/about" },
  { label: "الرحلات", href: "/trips" },

  { label: "الإعلانات", href: "/announcements" },
  { label: "تواصل معنا", href: "/contact" },
];

export default function Navbar() {
  return (
    <nav
      dir="rtl"
      className="flex items-center justify-between gap-4 px-5 py-8 md:px-10 md:py-10"
    >
      <a
        href="/"
        className="shrink-0 text-lg font-extrabold md:text-xl"
        style={{ color: BRAND }}
      >
        {AGENCY}
      </a>

      <ul className="hidden items-center gap-8 text-sm md:flex">
        {navLinks.slice(0, 4).map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>

      <a
        href="/contact"
        className="shrink-0 rounded-lg px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
        style={{ backgroundColor: BRAND }}
      >
        تواصل معنا
      </a>
    </nav>
  );
}