import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const noto = Noto_Sans_Thai({
  variable: "--font-noto",
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "PPK LINE CHATBOT",
  description: "ระบบส่งประกาศภายในโรงพยาบาลผ่าน LINE",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
