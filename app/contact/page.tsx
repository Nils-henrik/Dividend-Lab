import type { Metadata } from "next";
import ContactPageContent from "@/components/marketing/legal/ContactPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";
import { getCanonicalUrl } from "@/lib/seo/canonical";

export const metadata: Metadata = {
  title: "Kontakt",
  description:
    "Kontakta DivLab — frågor om plattformen, innehåll och redaktionella rättelser.",
  alternates: {
    canonical: getCanonicalUrl("/contact"),
  },
};

export default function ContactPage() {
  return (
    <MarketingPageShell>
      <ContactPageContent />
    </MarketingPageShell>
  );
}
