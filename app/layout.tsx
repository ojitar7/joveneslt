import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Jóvenes LT",
  description: "La app de Jóvenes LT",
  manifest: "/manifest.webmanifest"
};

export const viewport: Viewport = {
  themeColor: "#080d0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body><AppShell>{children}</AppShell></body></html>;
}