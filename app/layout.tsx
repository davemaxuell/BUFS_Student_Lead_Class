import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "How Machines Read Text — Tokenization Visualizer",
  description:
    "Interactive bilingual (EN/KR) lesson on tokenization, normalization, and the low-resource token tax.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
