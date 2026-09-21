import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

// Configuración de la tipografía similar a Gotham
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Jóvenes LT",
  description: "La app de Jóvenes LT",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#48040F",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={montserrat.variable}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}