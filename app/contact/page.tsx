import type { Metadata } from "next";
import ContactPageContent from "@/components/marketing/legal/ContactPageContent";
import MarketingPageShell from "@/components/marketing/MarketingPageShell";

export const metadata: Metadata = {
  title: "Kontakt | DivLab",
  description:
    "Kontaktinformation för DivLab — operatör och kontaktvägar under betaperioden.",
};

export default function ContactPage() {
  return (
    <MarketingPageShell>
      <ContactPageContent />
    </MarketingPageShell>
  );
}
