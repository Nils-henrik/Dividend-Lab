import type { Metadata } from "next";
import PublicContentShell from "@/components/layout/PublicContentShell";
import FrihetsmaskinenPublicContent from "@/components/frihetsmaskinen/FrihetsmaskinenPublicContent";
import JsonLdScript from "@/components/seo/JsonLd";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { breadcrumbJsonLd, webApplicationJsonLd } from "@/lib/seo/json-ld";
import { DIVLAB_BRAND_NAME } from "@/lib/site/brand";

const title = `Frihetsmaskinen – räkna på ekonomisk frihet | ${DIVLAB_BRAND_NAME}`;
const description =
  "Frihetsmaskinen är DivLabs FIRE-kalkylator. Uppskatta hur mycket kapital du kan behöva för ekonomisk frihet och hur sparkvot, avkastning och utgifter påverkar tidslinjen.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  keywords: [
    "ekonomisk frihet",
    "FIRE-kalkylator",
    "räkna på ekonomisk frihet",
    "hur mycket kapital behöver jag",
    "när kan jag sluta jobba",
    "sparkvot",
    "ekonomiskt oberoende",
  ],
  alternates: {
    canonical: getCanonicalUrl("/frihetsmaskinen"),
  },
  openGraph: {
    title: `Frihetsmaskinen | ${DIVLAB_BRAND_NAME}`,
    description,
    url: getCanonicalUrl("/frihetsmaskinen"),
    type: "website",
    locale: "sv_SE",
  },
};

export default async function FrihetsmaskinenPage() {
  const user = await getAuthenticatedUser();

  return (
    <PublicContentShell>
      <JsonLdScript
        data={[
          webApplicationJsonLd({
            name: "Frihetsmaskinen",
            description,
            path: "/frihetsmaskinen",
          }),
          breadcrumbJsonLd([
            { name: "Hem", path: "/" },
            { name: "Frihetsmaskinen", path: "/frihetsmaskinen" },
          ]),
        ]}
      />
      <FrihetsmaskinenPublicContent showAccountCta={!user} />
    </PublicContentShell>
  );
}
