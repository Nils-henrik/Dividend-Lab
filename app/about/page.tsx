import type { Metadata } from "next";
import AboutPageContent from "@/components/marketing/AboutPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export const metadata: Metadata = {
  title: "Om oss | DivLab",
  description:
    "Lär känna DivLab – en svensk plattform för marknadsöversikt, lärande, verktyg och gemenskap.",
};

export default function AboutPage() {
  return (
    <MarketingPageShell>
      <AboutPageContent />
    </MarketingPageShell>
  );
}
