import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

// Añadimos pesos finos (300, 400, 500) para un look más estilizado
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
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
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}