import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { NativePushRuntime } from "@/components/NativePushRuntime";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://astrared.vip"),
  title: {
    default: "AstraRed | Carta natal, sinastría y calendario astral",
    template: "%s | AstraRed",
  },
  description:
    "Explora tu carta natal, descubre afinidades y consulta un calendario astral para vivir tus decisiones con intención.",
  applicationName: "AstraRed",
  robots: { index: false, follow: false },
  verification: {
    google: "SKHJ_Wpphc6CEdj41DjB59QXas9xXlkXAZEp2HlpZb8",
  },
  openGraph: {
    title: "AstraRed | Carta natal, sinastría y calendario astral",
    description:
      "Carta natal, afinidades y calendario astral en un espacio pensado para conocerte mejor.",
    siteName: "AstraRed",
    locale: "es_VE",
    type: "website",
    images: ["/astrared-social.png"],
  },
  icons: {
    icon: "/astrared-icon-20261014.png",
    shortcut: "/astrared-icon-20261014.png",
    apple: "/astrared-apple-icon-20261014.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${outfit.variable} ${cormorant.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-slate-950 text-white" suppressHydrationWarning>
        <NativePushRuntime />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
