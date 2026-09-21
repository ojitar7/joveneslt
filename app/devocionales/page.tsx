import { DevotionalsSection } from "@/components/devotionals-section";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devocionales y Lecturas del Día | Jóvenes LT",
  description: "Reza en cualquier momento con el Evangelio del día, reflexiones bíblicas y devocionales temáticos.",
};

export default function DevotionalsPage() {
  return (
    <main className="min-h-screen bg-[#0D0D0D] text-white pt-20 pb-12">
      <DevotionalsSection />
    </main>
  );
}