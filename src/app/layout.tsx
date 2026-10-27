import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Mobile Cases, Accessories & More | Zuprano - Premium Quality, Free Shipping",
  description:
    "Zuprano - Premium mobile accessories online. Shop phone cases, powerbanks, screen protectors, phone stands & more. Fast shipping across India. Authentic products with warranty.",
  keywords:
    "phone cases, mobile accessories, transparent phone cases, powerbank, screen protector, phone stand, premium cases, India",
  authors: [{ name: "Zuprano" }],
  icons: { icon: "/logo.svg" },
  openGraph: {
    type: "website",
    siteName: "Zuprano",
    title: "Zuprano | Premium Mobile Accessories Store",
    description:
      "Shop premium mobile cases, powerbanks, screen protectors & accessories. Free shipping on orders above ₹500. Authentic products with warranty guaranteed.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Zuprano | Mobile Accessories Online Store",
    description:
      "Premium mobile accessories: cases, powerbanks, screen protectors. Free shipping, authentic products, fast delivery across India.",
  },
};

export const viewport: Viewport = { themeColor: "#EA580C" };

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
