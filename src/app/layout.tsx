import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Zuprano | Buy Mobile Phones, Accessories & Cases Online",
  description:
    "Shop the latest smartphones from Apple, Samsung, OnePlus, Xiaomi, Redmi, Realme, Vivo, Oppo, Motorola, Nothing and Google Pixel, plus chargers, earbuds, power banks, cases and screen protectors. Genuine products, fast delivery across India.",
  keywords:
    "mobile phones, smartphones, buy mobile online, iPhone, Samsung Galaxy, OnePlus, Redmi, Pixel, phone accessories, chargers, earbuds, power bank, phone cases, tempered glass, India",
  authors: [{ name: "Zuprano" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    type: "website",
    siteName: "Zuprano",
    title: "Zuprano | Your Mobile Store",
    description:
      "The latest smartphones from every major brand, with accessories and protection to match. Free delivery on orders above ₹500. Genuine products with brand warranty.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zuprano | Mobile Phones & Accessories",
    description: "Smartphones, chargers, earbuds, cases and screen protection. Genuine products, fast delivery across India.",
  },
};

export const viewport: Viewport = { themeColor: "#EA580C", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
