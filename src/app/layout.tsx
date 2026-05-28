import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Intercambiador de Alimentos — Creando Gigantes",
  description: "Intercambia cualquier alimento por equivalentes con los mismos macronutrientes. By edureciofit · Creando Gigantes.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Intercambiador CG",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Intercambiador de Alimentos — Creando Gigantes",
    description: "Intercambia cualquier alimento por equivalentes con los mismos macros. By edureciofit.",
    url: "https://edureciofit-calc.vercel.app",
    siteName: "Creando Gigantes",
    images: [
      {
        url: "https://edureciofit-calc.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Intercambiador de Alimentos — Creando Gigantes",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Intercambiador de Alimentos — Creando Gigantes",
    description: "Intercambia cualquier alimento por equivalentes con los mismos macros.",
    images: ["https://edureciofit-calc.vercel.app/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#09090B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-background text-text antialiased">
        {children}
      </body>
    </html>
  );
}
