import { getForumReputationBadge } from "@/lib/forum/reputation-badge";
import AccountIcon from "./AccountIcon";

type Props = {
  totalReceivedReactions?: number;
};

export default function ForumReputation({
  totalReceivedReactions = 0,
}: Props) {
  const badge = getForumReputationBadge(totalReceivedReactions);

  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-2.5 text-[#D4AF37]">
            <AccountIcon name="award" />
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
              Forumrykte
            </p>
            <h3 className="text-lg font-semibold text-white">{badge.label}</h3>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-6 text-gray-400">
          {badge.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-gray-500">
            Mottagna reaktioner
          </p>
          <p className="mt-5 text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-white tabular-nums">
            {badge.score}
          </p>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            Kvalitetsreaktioner på trådar och svar i forumet.
          </p>
        </article>

        <article className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-gray-500">
            Nästa nivå
          </p>
          <p className="mt-5 text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-white">
            {badge.nextLevel ? badge.nextLevel.label : "Högsta nivå"}
          </p>
          <p className="mt-4 text-sm leading-6 text-gray-400">
            {badge.nextLevel
              ? `${badge.nextLevel.remaining} reaktioner kvar till ${badge.nextLevel.label}.`
              : "Du har nått den högsta forumnivån."}
          </p>
        </article>
      </div>
    </section>
  );
}
