import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const notoArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", weight: ["300","400","500","600","700"], display: "swap" });

export const metadata: Metadata = {
  title: "بلدي AI — مساعد البلديات اللبنانية",
  description: "منصة الذكاء الاصطناعي القانونية والإدارية للبلديات اللبنانية",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${inter.variable} ${notoArabic.variable} font-arabic`}>
        {children}
      </body>
    </html>
  );
}
