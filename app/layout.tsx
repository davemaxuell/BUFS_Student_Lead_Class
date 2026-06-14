import type { Metadata } from "next";
import { Inter, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

// Highly legible bilingual pairing, self-hosted via next/font (no runtime CDN):
// Inter for Latin/numbers (large x-height, open apertures — survives projector
// blur), Noto Sans KR for Hangul. Korean glyphs fall through to Noto Sans KR.
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const notoKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-kr",
  display: "swap",
  preload: false, // CJK font is large — don't block first paint preloading it
});

export const metadata: Metadata = {
  title: "How Machines Read Text — Tokenization Visualizer",
  description:
    "Interactive bilingual (EN/KR) lesson on tokenization, normalization, and the low-resource token tax.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoKR.variable}`}>
      <body>{children}</body>
    </html>
  );
}
