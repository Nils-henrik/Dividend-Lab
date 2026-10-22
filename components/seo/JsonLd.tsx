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
        // JSON escaping alone does not protect an HTML script raw-text block.
        // User-provided </script> must stay data, including in forum metadata.
        __html: JSON.stringify(payload.length === 1 ? payload[0] : payload).replace(
          /</g,
          "\\u003c",
        ),
      }}
    />
  );
}
