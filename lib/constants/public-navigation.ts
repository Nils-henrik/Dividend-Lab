/** Primary public navigation for logged-out visitors. */
export const PUBLIC_NAV_LINKS = [
  { href: "/news", label: "Börsnyheter" },
  { href: "/learning", label: "Utbildning" },
  { href: "/frihetsmaskinen", label: "Frihetsmaskinen" },
  { href: "/forum", label: "Forum" },
  { href: "/about", label: "Om DivLab" },
] as const;

/** Secondary destinations linked from the footer. */
export const PUBLIC_SECONDARY_LINKS = [
  { href: "/features", label: "Funktioner" },
  { href: "/contact", label: "Kontakt" },
  { href: "/editorial", label: "Redaktionella riktlinjer" },
] as const;
