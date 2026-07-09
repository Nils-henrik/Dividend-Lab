import { premiumMembership } from "@/data/account";

export default function PremiumMembershipCard() {
  return (
    <article className="rounded-2xl border border-[#D4AF37]/25 bg-[#161616] p-6 shadow-[0_0_42px_rgba(212,175,55,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Premium-medlemskap
          </p>
          <h3 className="text-lg font-semibold text-white">
            {premiumMembership.status}
          </h3>
        </div>

        <span className="rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
          PRO
        </span>
      </div>

      <p className="mt-5 text-sm leading-6 text-gray-400">
        {premiumMembership.description}
      </p>

      <div className="mt-7 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/[0.06] px-4 py-3">
        <p className="text-sm leading-6 text-gray-300">
          En nybörjare kan vara PRO. En utdelningsmästare kan vara Free.
          Medlemskap och investerarnivå är oberoende system.
        </p>
      </div>
    </article>
  );
}
