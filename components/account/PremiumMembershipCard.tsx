import { premiumMembership } from "@/data/account";

export default function PremiumMembershipCard() {
  return (
    <article className="divlab-card border-divlab-blue/25 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 divlab-section-label">Premium-medlemskap</p>
          <h3 className="text-lg font-semibold text-divlab-text">
            {premiumMembership.status}
          </h3>
        </div>

        <span className="rounded-full border border-divlab-blue/35 bg-divlab-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-divlab-blue">
          PRO
        </span>
      </div>

      <p className="mt-5 text-sm leading-6 text-divlab-text-secondary">
        {premiumMembership.description}
      </p>

      <div className="mt-7 rounded-xl border divlab-border-neutral divlab-inset px-4 py-3">
        <p className="text-sm leading-6 text-divlab-text-secondary">
          En nybörjare kan vara PRO. En utdelningsmästare kan vara Free.
          Medlemskap och investerarnivå är oberoende system.
        </p>
      </div>
    </article>
  );
}
