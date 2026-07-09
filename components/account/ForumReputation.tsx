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
    <section className="divlab-card p-6">
      <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-divlab-blue/20 bg-divlab-blue/10 p-2.5 text-divlab-blue">
            <AccountIcon name="award" />
          </div>
          <div>
            <p className="mb-3 divlab-section-label">Forumrykte</p>
            <h3 className="text-lg font-semibold text-divlab-text">{badge.label}</h3>
          </div>
        </div>
        <p className="max-w-xl text-sm leading-6 text-divlab-text-secondary">
          {badge.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <article className="rounded-xl border divlab-border-neutral divlab-inset p-5">
          <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-divlab-text-muted">
            Mottagna reaktioner
          </p>
          <p className="mt-5 text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-divlab-text tabular-nums">
            {badge.score}
          </p>
          <p className="mt-4 text-sm leading-6 text-divlab-text-secondary">
            Kvalitetsreaktioner på trådar och svar i forumet.
          </p>
        </article>

        <article className="rounded-xl border divlab-border-neutral divlab-inset p-5">
          <p className="text-[10px] font-medium uppercase leading-[1.35] tracking-[0.18em] text-divlab-text-muted">
            Nästa nivå
          </p>
          <p className="mt-5 text-[1.42rem] font-medium leading-none tracking-[-0.025em] text-divlab-text">
            {badge.nextLevel ? badge.nextLevel.label : "Högsta nivå"}
          </p>
          <p className="mt-4 text-sm leading-6 text-divlab-text-secondary">
            {badge.nextLevel
              ? `${badge.nextLevel.remaining} reaktioner kvar till ${badge.nextLevel.label}.`
              : "Du har nått den högsta forumnivån."}
          </p>
        </article>
      </div>
    </section>
  );
}
