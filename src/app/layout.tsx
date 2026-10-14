import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
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
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
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
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
