import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = process.env.APP_URL || "https://eventlite.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EventLite - Gestion d'événements simplifiée",
    template: "%s | EventLite",
  },
  description:
    "Créez, gérez et partagez vos événements facilement. Plateforme minimaliste avec inscriptions, liste d'attente et notifications automatiques.",
  keywords: [
    "événements",
    "gestion événements",
    "inscription événement",
    "organiser événement",
    "meetup",
    "conférence",
    "workshop",
    "billetterie gratuite",
    "event management",
  ],
  authors: [{ name: "EventLite" }],
  creator: "EventLite",
  publisher: "EventLite",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: siteUrl,
    siteName: "EventLite",
    title: "EventLite - Gestion d'événements simplifiée",
    description:
      "Créez, gérez et partagez vos événements facilement. Inscriptions, liste d'attente et notifications automatiques.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "EventLite - Gestion d'événements simplifiée",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EventLite - Gestion d'événements simplifiée",
    description:
      "Créez, gérez et partagez vos événements facilement. Inscriptions, liste d'attente et notifications automatiques.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#3d8b40" },
    { media: "(prefers-color-scheme: dark)", color: "#2d6b30" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
