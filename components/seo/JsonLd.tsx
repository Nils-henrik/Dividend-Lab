import type { JsonLd } from "@/lib/seo/json-ld";

type Props = {
  data: JsonLd | JsonLd[];
};

/** Server-rendered JSON-LD script for structured data. */
export default function JsonLdScript({ data }: Props) {
  const payload = Array.isArray(data) ? data : [data];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload.length === 1 ? payload[0] : payload),
      }}
    />
  );
}
