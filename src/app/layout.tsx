import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from 'next/font/google';
import SiteHeaderNav from "@/components/SiteHeaderNav";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-bebas-neue',
});

export const metadata: Metadata = {
  title: "Prisma Events Registration",
  description: "Register for Prisma Events",
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
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${spaceGrotesk.className} ${bebasNeue.variable}`}>
        <SiteHeaderNav />
        {children}
      </body>
    </html>
  );
}
