import type { Metadata, Viewport } from "next";
import { Geist_Mono, Instrument_Serif, Inter } from "next/font/google";
import "./globals.css";

// Same faces as the landing hero: Instrument Serif for titles, Inter for everything else.
const display = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Baton — every request has an owner",
  description: "Real-time coordination for event crews: QR onboarding, live incident cards, duplicate-report merging and closed-loop updates for attendees.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#fbf8f6" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${display.variable} ${body.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
