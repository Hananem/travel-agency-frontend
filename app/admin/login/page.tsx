'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Mail, Eye, EyeOff, Plane, LoaderCircle } from 'lucide-react';
import { authService } from '@/services/auth.service';

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.login(email.trim(), password);
      router.replace('/admin');
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء تسجيل الدخول.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main
      dir="rtl"
      className="grid min-h-screen bg-white text-foreground lg:grid-cols-2"
    >
      {/* Brand panel */}
      <section className="hidden bg-foreground px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
            <Plane size={22} />
          </span>
          <span className="text-lg font-extrabold tracking-tight">
            وكالة الشنة
          </span>
        </div>

        <div>
          <span className="text-sm font-semibold text-white/60">
            لوحة الإدارة
          </span>

          <h2 className="mt-4 max-w-md text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            أدِر رحلاتك
            <br />
            ووجهاتك بسهولة
          </h2>

          <p className="mt-5 max-w-sm leading-8 text-white/75">
            إدارة الرحلات والوجهات والإعلانات وفريق العمل من مكان واحد.
          </p>
        </div>

        <p className="text-xs text-white/50">
          © 2026 وكالة الشنة للسياحة والأسفار
        </p>
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          {/* Mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground">
              <Plane size={22} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              وكالة الشنة
            </span>
          </div>

          <span className="text-sm font-semibold text-primary">
            تسجيل الدخول
          </span>

          <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            مرحبًا بعودتك
          </h1>

          <p className="mt-4 text-sm leading-7 text-muted-foreground md:text-base">
            أدخل بيانات حسابك للمتابعة إلى لوحة التحكم.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-6 border-t border-border pt-8"
          >
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-bold">
                البريد الإلكتروني
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full border border-border bg-white py-3 pr-10 pl-4 text-left text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold"
              >
                كلمة المرور
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="w-full border border-border bg-white py-3 pr-10 pl-11 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-primary"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading && <LoaderCircle className="h-4 w-4 animate-spin" />}
              {isLoading ? 'جارٍ تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>

          <p className="mt-10 text-xs text-muted-foreground lg:hidden">
            © 2026 وكالة الشنة للسياحة والأسفار
          </p>
        </div>
      </section>
    </main>
  );
}