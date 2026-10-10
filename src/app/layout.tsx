import type { Metadata } from "next";
import { Outfit, Cormorant_Garamond } from "next/font/google";
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
  title: "Astra Red | Conexiones Astrales & Sinastría",
  description: "Descubre tu mapa natal, compatibilidad de pareja y calendario lunar VIP.",
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
      </body>
    </html>
  );
}
