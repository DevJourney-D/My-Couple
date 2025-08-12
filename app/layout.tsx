import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Couple - แอปคู่รักที่สมบูรณ์แบบ",
  description: "แอปพลิเคชันสำหรับคู่รักที่รวมทุกฟีเจอร์ที่ต้องการ - ไทม์ไลน์ความรัก, สมุดบันทึก, แกลลอรี่รูปภาพ, เกมส์, AI Chat และอีกมากมาย",
  keywords: ["คู่รัก", "ความรัก", "แอปคู่รัก", "love app", "couple app", "timeline", "journal", "photo gallery"],
  authors: [{ name: "My Couple Team" }],
  creator: "Our Love Story",
  publisher: "Our Love Story",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: "My Couple - แอปคู่รักที่สมบูรณ์แบบ",
    description: "แอปพลิเคชันสำหรับคู่รักที่รวมทุกฟีเจอร์ที่ต้องการ - ไทม์ไลน์ความรัก, สมุดบันทึก, แกลลอรี่รูปภาพ, เกมส์, AI Chat และอีกมากมาย",
    type: "website",
    locale: "th_TH",
    siteName: "Our Love Story",
  },
  twitter: {
    card: "summary_large_image",
    title: "My Couple - แอปคู่รักที่สมบูรณ์แบบ",
    description: "แอปพลิเคชันสำหรับคู่รักที่รวมทุกฟีเจอร์ที่ต้องการ",
  },
  robots: {
    index: false,
    follow: false,
  },
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#1d4ed8" />
        <meta name="msapplication-TileColor" content="#1d4ed8" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
