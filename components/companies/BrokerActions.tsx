import { resolveBrokerLinks } from "@/lib/companies/broker-links";
import type { CompanyProfile } from "@/lib/companies/types";

export default function BrokerActions({
  company,
}: {
  company: Pick<CompanyProfile, "avanzaUrl" | "nordnetUrl">;
}) {
  const links = resolveBrokerLinks(company);
  if (links.length === 0) return null;

  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-divlab-text-muted">Extern länk</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        {links.map((link) => (
          <a
            key={link.broker}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="divlab-btn-secondary inline-flex min-h-11 items-center justify-center px-3 py-2 text-center text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-divlab-blue/50"
          >
            {link.label}
            <span className="sr-only"> (öppnas i ny flik)</span>
          </a>
        ))}
      </div>
    </div>
  );
}
