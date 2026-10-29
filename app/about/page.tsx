'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { teamService, type TeamMember } from '@/services/team.service';

const values = [
  {
    number: '01',
    title: 'نلتزم بالجودة والإتقان في كل تفصيلة من تفاصيل السفر، ونحرص على تقديم خدمات متميزة تلبي توقعاتك وتفوق تطلعاتك دائمًا في كل رحلة',
    description:
      'نهتم بأدق التفاصيل ونحرص على تقديم خدمات متميزة تلبي توقعات عملائنا.',
    image: '/destination12.jpg',
    imageAlt: 'خدمة متقنة وتفاصيل مدروسة',
  },
  {
    number: '02',
    title: 'نبني الثقة مع عملائنا من خلال الشفافية والوضوح والالتزام بالوعود، ونضع رضاهم وراحتهم في مقدمة أولوياتنا لنكسب علاقات طويلة الأمد معهم دائمًا',
    description:
      'نبني علاقات طويلة الأمد مع عملائنا من خلال الوضوح والالتزام والمصداقية.',
    image: '/destination13.jpg',
    imageAlt: 'علاقات قائمة على الثقة',
  },
  {
    number: '03',
    title: 'نصنع لك تجارب سفر استثنائية تجمع بين التخطيط الجيد والراحة والاستمتاع، لتعود من رحلتك بذكريات جميلة تبقى في ذاكرتك وتستحق أن تُروى',
    description:
      'نسعى إلى تقديم تجارب مميزة تجمع بين التخطيط الجيد والراحة والاستمتاع.',
    image: '/destination11.jpg',
    imageAlt: 'تجربة سفر استثنائية',
  },
];

const visionItems = [
  {
    question: 'ما هي رؤيتنا للسفر؟',
    answer:
      'أن يكون السفر تجربة سهلة وممتعة، تبدأ من التخطيط الجيد وتنتهي بذكريات جميلة تستحق أن تُروى.',
  },
  {
    question: 'ما الذي نسعى إلى تحقيقه؟',
    answer:
      'نسعى إلى تقديم رحلات وبرامج سياحية منظمة بعناية، تجمع بين الجودة والراحة وجودة الخدمة.',
  },
  {
    question: 'كيف نحافظ على ثقة عملائنا؟',
    answer:
      'بالوضوح في المعلومات والالتزام بالوعود والاهتمام براحة المسافر في كل مراحل رحلته.',
  },
];

const services = [
  {
    number: '01',
    title: 'تنظيم الرحلات',
    description:
      'رحلات مصممة بعناية لتناسب اهتماماتك وتمنحك فرصة اكتشاف وجهات جديدة.',
  },
  {
    number: '02',
    title: 'برامج سياحية',
    description:
      'برامج متكاملة تساعدك على الاستفادة من وقتك والاستمتاع بكل تفاصيل رحلتك.',
  },
  {
    number: '03',
    title: 'خدمات السفر',
    description:
      'نساعدك في ترتيب تفاصيل سفرك لتكون تجربتك أكثر سهولة وراحة.',
  },
];

export default function AboutPage() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadTeam = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await teamService.getPublicTeam();

        if (active) {
          setTeam(response);
        }
      } catch {
        if (active) {
          setError('تعذر تحميل أعضاء الفريق حاليًا.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadTeam();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main
      dir="rtl"
      className="overflow-hidden bg-white text-foreground"
    >
      {/* Vision */}
      <section className="px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Title, text and image */}
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-primary">
              من نحن
            </span>

            <h2 className="mt-4 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              رؤيتنا
            </h2>

            <p className="mt-6 max-w-lg text-base leading-8 text-muted-foreground">
              نطمح إلى أن نكون الوجهة الأولى لكل من يبحث عن تجربة سفر
              منظمة ومريحة، من خلال الاهتمام بالتفاصيل وتقديم رحلات
              تناسب تطلعات المسافرين وتترك في ذاكرتهم أجمل الذكريات.
            </p>

            <Link
              href="/trips"
              className="mt-8 inline-flex w-fit items-center gap-3 bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              تصفح رحلاتنا
              <span aria-hidden="true">←</span>
            </Link>

            {/* Portrait image: taller and narrower */}
            <div className="relative mt-10 aspect-[3/4] w-full max-w-sm overflow-hidden bg-muted lg:max-w-md">
              <Image
                src="/destination1.jpg"
                alt="رحلة سياحية منظمة بعناية"
                fill
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover"
              />
            </div>
          </div>

          {/* Image and expandable items */}
          <div className="flex flex-col gap-8">
            {/* Portrait image: taller and narrower */}
            <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden bg-muted lg:max-w-md">
              <Image
                src="/destination2.jpg"
                alt="وجهة سياحية مميزة"
                fill
                sizes="(max-width: 1024px) 100vw, 400px"
                className="object-cover"
              />
            </div>

            <div className="border-t border-border">
              {visionItems.map((item) => (
                <details
                  key={item.question}
                  className="group border-b border-border py-5"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold [&::-webkit-details-marker]:hidden">
                    {item.question}

                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-lg transition group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>

                  <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values: each value beside an image */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center lg:mb-20">
            <span className="text-sm font-semibold text-primary">
              ما يميزنا
            </span>

            <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              القيم التي تقود رحلتنا
            </h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              نحرص على أن تكون كل تجربة نقدمها مبنية على مبادئ واضحة
              واهتمام حقيقي باحتياجات عملائنا. نصغي إليك منذ اللحظة
              الأولى لنفهم ما تبحث عنه، ونخطط لكل رحلة بعناية، ونرافقك
              في كل مرحلة من مراحل السفر، لتشعر بالراحة والثقة من
              لحظة الحجز حتى العودة.
            </p>
          </div>

          <div className="space-y-14 lg:space-y-24">
            {values.map((value, index) => {
              const reversed = index % 2 === 1;

              return (
                <article
                  key={value.number}
                  className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
                >
                  {/* Image: portrait, taller and narrower */}
                  <div
                    className={`relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden bg-muted lg:max-w-md ${
                      reversed
                        ? 'lg:order-2 lg:mr-auto lg:ml-0'
                        : 'lg:ml-auto lg:mr-0'
                    }`}
                  >
                    <Image
                      src={value.image}
                      alt={value.imageAlt}
                      fill
                      sizes="(max-width: 1024px) 100vw, 400px"
                      className="object-cover"
                    />
                  </div>

                  {/* Text */}
                  <div className={reversed ? 'lg:order-1' : ''}>
                    <span className="block text-2xl font-bold text-primary">
                      {value.number}
                    </span>

                    <h3 className="mt-6 max-w-[400px] text-lg font-black leading-8 [-webkit-text-stroke:0.7px_currentColor] sm:text-xl">
                      {value.title}
                    </h3>

                    <p className="mt-4 max-w-lg text-base leading-8 text-muted-foreground">
                      {value.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-foreground px-4 py-16 text-white sm:px-6 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 lg:mb-14">
            <span className="text-sm font-semibold text-white/70">
              ماذا نقدم؟
            </span>

            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-16">
              <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
                خدمات متكاملة مصممة لتجعل رحلتك أسهل
              </h2>

              <p className="max-w-md leading-8 text-white/75 lg:shrink-0">
                نساعدك على التخطيط لرحلتك من خلال خدمات تهدف إلى توفير
                تجربة سفر أكثر تنظيمًا وراحة.
              </p>
            </div>
          </div>

          <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-14">
            {/* Large portrait image: taller and narrower */}
            <div className="relative mx-auto min-h-[420px] w-full max-w-md overflow-hidden bg-white/10 sm:min-h-[520px] lg:min-h-[620px]">
              <Image
                src="/destination14.jpg"
                alt="خدمات سفر وسياحة متكاملة"
                fill
                sizes="(max-width: 1024px) 100vw, 450px"
                className="object-cover"
              />
            </div>

            {/* Services stacked */}
            <div className="flex flex-col justify-center border-t border-white/20">
              {services.map((service) => (
                <article
                  key={service.number}
                  className="group flex items-start gap-5 border-b border-white/20 py-7 sm:gap-6 sm:py-8"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center text-sm font-bold text-white">
                    {service.number}
                  </span>

                  <div>
                    <h3 className="text-xl font-bold text-white sm:text-2xl">
                      {service.title}
                    </h3>

                    <p className="mt-3 leading-8 text-white/75">
                      {service.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <span className="text-sm font-semibold text-primary">
              الأشخاص وراء التجربة
            </span>

            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              تعرّف على فريقنا
            </h2>

            <p className="mt-4 leading-8 text-muted-foreground">
              فريق يعمل على الاهتمام بالتفاصيل ومساعدتك في الحصول
              على تجربة سفر منظمة ومميزة.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse text-center">
                  <div className="aspect-[3/4] w-full bg-muted" />
                  <div className="mx-auto mt-5 h-5 w-32 bg-muted" />
                  <div className="mx-auto mt-3 h-4 w-24 bg-muted" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div role="alert" className="px-6 py-12 text-center">
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : team.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-lg font-semibold">
                فريقنا قيد التحديث
              </p>

              <p className="mt-3 text-muted-foreground">
                ستجد هنا معلومات أعضاء الفريق قريبًا.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {team.map((member) => (
                <article
                  key={member.id}
                  tabIndex={0}
                  className="group text-center outline-none transition duration-300 hover:-translate-y-1"
                >
                  <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-primary/10 text-4xl font-bold text-primary">
                    {member.imageUrl ? (
                      <Image
                        src={member.imageUrl}
                        alt={member.name}
                        fill
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <span>{member.name.trim().charAt(0)}</span>
                    )}

                    {/* Hover modal: centered on the image */}
                    <div
                      role="tooltip"
                      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 opacity-0 transition duration-200 group-hover:opacity-100 group-focus:opacity-100"
                    >
                      <div className="w-full max-w-[220px] bg-white p-4 text-start text-foreground shadow-xl">
                        <h4 className="text-base font-black">
                          {member.name}
                        </h4>

                        <p className="mt-1 text-xs font-medium text-primary">
                          {member.position}
                        </p>

                        {member.bio && (
                          <p className="mt-2 line-clamp-5 text-xs font-normal leading-6 text-muted-foreground">
                            {member.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-5 text-2xl font-black">
                    {member.name}
                  </h3>

                  <p className="mt-2 text-sm font-medium text-primary">
                    {member.position}
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 lg:px-10 lg:py-24">
        <div className="relative mx-auto max-w-7xl overflow-hidden bg-foreground px-6 py-16 text-center sm:px-12 sm:py-24">
          <Image
            src="/hero-img.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
          />

          <div className="absolute inset-0 bg-black/60" />

          <div className="relative z-10 mx-auto max-w-3xl">
            <span className="text-sm font-semibold text-white/80">
              حان وقت المغامرة
            </span>

            <h2 className="mt-4 text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              وجهتك القادمة تبدأ من هنا
            </h2>

            <p className="mx-auto mt-5 max-w-xl leading-8 text-white/80">
              اكتشف الرحلات المتاحة واختر التجربة التي تناسبك،
              ودعنا نساعدك في التخطيط لمغامرتك القادمة.
            </p>

            <Link
              href="/trips"
              className="mt-8 inline-flex items-center justify-center bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              استكشف الرحلات
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}