import type { Metadata } from "next";
import { Suspense } from "react";
import SiteHeaderNav from "@/components/SiteHeaderNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Enrol · Prisma",
  description: "Register for Prisma Events and verify your regional identity.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/Prisma_Logo_White.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    title: "Prisma Events Registration",
    description: "Register for Prisma Events",
    images: [
      {
        url: "https://register.prisma.events/sm_banner.png",
        width: 1504,
        height: 787,
        alt: "Prisma Events Registration Preview",
      },
    ],
    url: "https://register.prisma.events",
  },
  twitter: {
    card: "summary_large_image",
    title: "Prisma Events Registration",
    description: "Register for Prisma Events",
    images: ["https://register.prisma.events/sm_banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-[rgba(123,97,255,0.3)] selection:text-white">
        {/* useSearchParams (?return=) needs a Suspense boundary */}
        <Suspense fallback={<div className="h-16 border-b border-[var(--color-rule)] bg-[var(--color-void)]" />}>
          <SiteHeaderNav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
