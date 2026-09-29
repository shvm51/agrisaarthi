import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Devanagari, Fraunces } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const notoDeva = Noto_Sans_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari", "latin"],
  display: "swap",
});
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "AgriSaarthi — AI-Powered Farming Intelligence",
    template: "%s · AgriSaarthi",
  },
  description:
    "What should I do today? Farm-specific intelligence: weather, disease risk, irrigation, markets and profitability — in English, Hindi and Marathi.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AgriSaarthi",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1B4332" },
    { media: "(prefers-color-scheme: dark)", color: "#12140F" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${notoDeva.variable} ${fraunces.variable} min-h-dvh antialiased`}
        style={{
          fontFamily:
            "var(--font-inter), var(--font-noto-deva), ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
