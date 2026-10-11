import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { HOME_DESCRIPTION, HOME_TITLE, LEGAL_NAME, SITE_NAME, SITE_URL } from "@/lib/site";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono-face", subsets: ["latin"], weight: ["400", "500", "700", "800"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${HOME_TITLE} | ${SITE_NAME}`, template: `%s | ${SITE_NAME}` },
  description: HOME_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: LEGAL_NAME, url: "https://blanxer.com" }],
  creator: LEGAL_NAME,
  publisher: LEGAL_NAME,
  category: "technology",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    title: `${HOME_TITLE} | ${SITE_NAME}`,
    description: HOME_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    locale: "en_NP",
    type: "website",
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "BlanxerAPI: your AI agent builds the store, Blanxer powers it" }],
  },
  twitter: { card: "summary_large_image", title: `${HOME_TITLE} | ${SITE_NAME}`, description: HOME_DESCRIPTION, images: ["/og.jpg"] },
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], apple: "/apple-touch-icon.png" },
  alternates: { types: { "text/plain": "/llms.txt" } },
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = { themeColor: "#ffffff", colorScheme: "light" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
