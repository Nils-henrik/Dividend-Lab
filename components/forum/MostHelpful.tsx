import { mostHelpfulMembers } from "@/data/forum";

type Props = {
  embedded?: boolean;
};

export default function MostHelpful({ embedded = false }: Props) {
  const content =
    mostHelpfulMembers.length === 0 ? (
      <p className="mt-3 text-[11px] leading-5 text-divlab-text-muted">
        Ingen utmärkelsesaktivitet än.
      </p>
    ) : (
      <div className="mt-3 space-y-2">
        {mostHelpfulMembers.map((member) => (
          <div
            key={member.username}
            className="flex items-center justify-between gap-2 border-b divlab-border-neutral pb-2 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-xs font-medium text-divlab-text">{member.username}</p>
              <p className="mt-0.5 text-[11px] text-divlab-text-muted">
                {member.specialty}
              </p>
            </div>
            <span className="rounded-full border border-divlab-blue/25 bg-divlab-blue/10 px-2 py-0.5 text-[11px] text-divlab-blue tabular-nums">
              {member.recognition}
            </span>
          </div>
        ))}
      </div>
    );

  if (embedded) {
    return content;
  }

  return (
    <section className="divlab-aside-panel">
      <h2 className="divlab-aside-panel-title">Mest hjälpsamma denna vecka</h2>
      <p className="mt-1.5 text-[11px] leading-5 text-divlab-text-muted">
        Utmärkelser baseras på kvalitativa bidrag, inte popularitet.
      </p>
      {content}
    </section>
  );
}
