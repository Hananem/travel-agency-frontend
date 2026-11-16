import { Suspense } from "react";
import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Providers from "./providers";
import HideOnAdmin from "./hide-on-admin";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "وكالة أفق للسفر والسياحة",
    template: "%s | وكالة أفق للسفر والسياحة",
  },
  description:
    "وكالة أفق للسفر والسياحة في قمار، ولاية الوادي، الجزائر.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen font-sans antialiased">
        <Providers>
          <Suspense fallback={null}>
            <HideOnAdmin>
              <Navbar />
            </HideOnAdmin>
          </Suspense>

          {children}

          <Suspense fallback={null}>
            <HideOnAdmin>
              <Footer />
            </HideOnAdmin>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
