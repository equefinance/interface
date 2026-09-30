import type { Metadata, Viewport } from "next";
import { Spline_Sans_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const splineSansMono = Spline_Sans_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-body",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Eque — DeFi, rebuilt onchain",
  description:
    "Eque is a dark, minimal DeFi interface. Quiet canvas, one loud signal.",
  icons: {
    icon: [{ url: "/favicon.ico", type: "image/x-icon" }],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("dark", splineSansMono.variable, inter.variable)}
    >
      <body className="bg-[#070A0F] text-[#E4EAF0] antialiased">
        {children}
      </body>
    </html>
  );
}
