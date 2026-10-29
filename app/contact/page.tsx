'use client';

import { useState, type FormEvent } from 'react';
import { Clock, MapPin, Phone } from 'lucide-react';

type ContactForm = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const initialForm: ContactForm = {
  name: '',
  email: '',
  phone: '',
  subject: 'استفسار عن رحلة',
  message: '',
};

const contactInfo = [
  {
    title: 'العنوان',
    text: 'وكالة الشنة للسفر والسياحة — قمار، ولاية الوادي',
    icon: MapPin,
  },
  {
    title: 'الهاتف',
    text: 'للاستفسار عن رقم الهاتف، يرجى التواصل مع الوكالة عبر قنواتها الرسمية.',
    icon: Phone,
  },
  {
    title: 'ساعات العمل',
    text: 'تواصل مع الوكالة لمعرفة أوقات استقبال العملاء.',
    icon: Clock,
  },
];

const inputClass =
  'w-full rounded-none border border-border bg-white px-4 py-3 outline-none transition placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20';

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  function updateField(
    field: keyof ContactForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSuccess('');
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          result?.message ?? 'تعذر إرسال رسالتك. حاول مرة أخرى.',
        );
      }

      setSuccess('تم إرسال رسالتك بنجاح. سنتواصل معك في أقرب وقت.');
      setForm(initialForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء إرسال الرسالة.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="min-h-screen overflow-hidden bg-white text-foreground"
    >
      {/* Hero (no image, no colored background) */}
      <section className="px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pb-24 lg:pt-8">
        <div className="mx-auto flex min-h-[380px] max-w-7xl items-center justify-center text-center sm:min-h-[440px] lg:min-h-[500px]">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <span className="mb-6 inline-flex rounded-none border border-border px-5 py-2 text-sm font-medium text-primary">
              وكالة الشنة للسفر والسياحة
            </span>

            <h1 className="text-4xl font-black leading-tight text-foreground sm:text-5xl lg:text-6xl">
              تواصل معنا
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
              لديك سؤال عن رحلة أو ترغب في معرفة المزيد عن خدماتنا؟
              يسعدنا استقبال رسالتك ومساعدتك في الحصول على المعلومات
              التي تحتاجها.
            </p>
          </div>
        </div>
      </section>

      {/* Contact content */}
      <section className="px-4 pb-16 sm:px-6 lg:px-10 lg:pb-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Contact information */}
          <aside className="bg-foreground p-8 text-white sm:p-10">
            <span className="text-sm font-semibold text-white/70">
              نحن هنا لمساعدتك
            </span>

            <h2 className="mt-3 text-3xl font-black leading-tight sm:text-4xl">
              دعنا نساعدك في التخطيط لرحلتك القادمة
            </h2>

            <p className="mt-5 leading-8 text-white/75">
              أرسل استفسارك عبر النموذج، أو تواصل معنا باستخدام
              معلومات الاتصال الرسمية للوكالة.
            </p>

            <div className="mt-8 border-t border-white/20">
              {contactInfo.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-5 border-b border-white/20 py-6"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none border border-white/40">
                      <Icon className="h-5 w-5" />
                    </span>

                    <div>
                      <h3 className="text-lg font-bold">
                        {item.title}
                      </h3>

                      <p className="mt-2 text-sm leading-7 text-white/75">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Contact form */}
          <section className="rounded-none border border-border bg-card p-6 sm:p-9">
            <h2 className="text-2xl font-black sm:text-3xl">
              أرسل لنا رسالة
            </h2>

            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              املأ البيانات التالية وسنتمكن من فهم استفسارك بشكل أفضل.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-bold"
                  >
                    الاسم الكامل
                  </label>

                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(event) =>
                      updateField('name', event.target.value)
                    }
                    placeholder="أدخل اسمك"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-bold"
                  >
                    رقم الهاتف
                  </label>

                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    maxLength={30}
                    value={form.phone}
                    onChange={(event) =>
                      updateField('phone', event.target.value)
                    }
                    placeholder="أدخل رقم هاتفك"
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-bold"
                >
                  البريد الإلكتروني
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={254}
                  value={form.email}
                  onChange={(event) =>
                    updateField('email', event.target.value)
                  }
                  placeholder="example@email.com"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="mb-2 block text-sm font-bold"
                >
                  موضوع الرسالة
                </label>

                <select
                  id="subject"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={(event) =>
                    updateField('subject', event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="استفسار عن رحلة">
                    استفسار عن رحلة
                  </option>
                  <option value="الرحلات السياحية">
                    الرحلات السياحية
                  </option>
                  <option value="الحجوزات">
                    الحجوزات
                  </option>
                  <option value="طلب معلومات">
                    طلب معلومات
                  </option>
                  <option value="موضوع آخر">
                    موضوع آخر
                  </option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-bold"
                >
                  رسالتك
                </label>

                <textarea
                  id="message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={3000}
                  rows={5}
                  value={form.message}
                  onChange={(event) =>
                    updateField('message', event.target.value)
                  }
                  placeholder="اكتب استفسارك أو تفاصيل الرحلة التي تبحث عنها..."
                  className={`${inputClass} resize-y leading-7`}
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-none bg-red-50 p-4 text-sm leading-6 text-red-700"
                >
                  {error}
                </p>
              )}

              {success && (
                <p
                  role="status"
                  className="rounded-none bg-green-50 p-4 text-sm leading-6 text-green-700"
                >
                  {success}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-none bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'جارٍ إرسال الرسالة...' : 'إرسال الرسالة'}
              </button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}