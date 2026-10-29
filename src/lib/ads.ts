export type AdType = "عرض خاص" | "إعلان" | "خبر";

export type Ad = {
  id: string;
  type: AdType;
  title: string;
  description: string;
  img: string;
  badge?: string; // مثل: خصم 20%
  endDate?: string; // صيغة: "2026-12-31" (بعدها يختفي الإعلان تلقائيًا)
  cta?: string; // نص الزر
  link?: string; // رابط داخلي أو خارجي، وإن تُرك فارغًا يفتح واتساب
  featured?: boolean; // إعلان مميز يظهر في الأعلى
};

// رقم واتساب الوكالة بصيغة دولية بدون + (الجزائر = 213)
export const WHATSAPP = "213555000000";

const u = (id: string, w = 1200) => `https://images.unsplash.com/${id}?w=${w}`;

export const ads: Ad[] = [
  {
    id: "umrah-2026",
    type: "عرض خاص",
    title: "عروض العمرة لشتاء 2026",
    description:
      "رحلات عمرة شاملة (الطيران، الفندق قرب الحرم، النقل والتأشيرة) مع مرافقة مرشد ديني. المقاعد محدودة، سارع بالحجز.",
    img: u("photo-1591604129939-f1efa4d9f7fa"),
    badge: "المقاعد محدودة",
    endDate: "2026-12-31",
    cta: "احجز مقعدك",
    featured: true,
  },
  {
    id: "bali-offer",
    type: "عرض خاص",
    title: "بالي بأقل الأسعار",
    description: "7 أيام في بالي شاملة الفندق والطيران والجولات السياحية بخصم خاص على الحجز المبكر.",
    img: u("photo-1537996194471-e657df975ab4"),
    badge: "خصم 20%",
    endDate: "2026-11-30",
    cta: "استفد من العرض",
    link: "/explore/tanah-gajah",
  },
  {
    id: "visa-service",
    type: "إعلان",
    title: "خدمة استخراج التأشيرات",
    description: "نساعدك في تحضير ملف التأشيرة (شنغن، تركيا، دبي وغيرها) بأسرع وقت وبأسعار مناسبة.",
    img: u("photo-1436491865332-7a61a109cc05"),
    cta: "اطلب استشارة",
  },
  {
    id: "new-office",
    type: "خبر",
    title: "افتتاح فرع جديد",
    description: "يسعدنا إعلامكم بافتتاح فرعنا الجديد لخدمتكم بشكل أقرب. بانتظاركم لتقديم أفضل العروض.",
    img: u("photo-1521737604893-d14cc237f11d"),
    cta: "تواصل معنا",
  },
  {
    id: "turkey-trip",
    type: "عرض خاص",
    title: "رحلة إسطنبول 5 أيام",
    description: "إقامة في فندق 4 نجوم مع جولات يومية وزيارة أشهر المعالم، انطلاقًا من الجزائر العاصمة.",
    img: u("photo-1524231757912-21f4fe3a7200"),
    badge: "جديد",
    endDate: "2027-01-15",
    cta: "احجز الآن",
  },
];