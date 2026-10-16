import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Gloock } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";

// Gloock, de Duarte Pires: serifa de alto contraste com ar de capa de livro antigo.
const gloock = Gloock({ subsets: ["latin", "latin-ext"], weight: "400", variable: "--font-gloock", display: "swap" });
const geist = Geist({ subsets: ["latin", "latin-ext"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    : undefined,
  title: { default: "Santo Terço Book Club", template: "%s · Santo Terço" },
  description: "O clube de leitura do Santo Terço: o próximo livro, os jantares, os vinhos e os bitaites.",
  applicationName: "Santo Terço",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  openGraph: {
    title: "Santo Terço Book Club",
    description: "Leituras, jantares e bitaites entre colegas.",
    images: [{ url: "/brand/og.jpg", width: 1200, height: 630 }],
    locale: "pt_PT",
    type: "website",
  },
  appleWebApp: { capable: true, title: "Santo Terço", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#f4f5f8",
  colorScheme: "only light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-PT" className={`${gloock.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
