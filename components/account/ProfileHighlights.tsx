import { profileHighlights } from "@/data/account";
import AccountIcon from "./AccountIcon";

export default function ProfileHighlights() {
  const compactHighlights = [
    profileHighlights.favoriteSector,
    profileHighlights.currentGoal,
  ];

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article className="divlab-card p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-divlab-blue/20 bg-divlab-blue/10 p-2.5 text-divlab-blue">
            <AccountIcon name={profileHighlights.philosophy.icon} />
          </div>
          <div>
            <p className="mb-3 divlab-section-label">
              {profileHighlights.philosophy.title}
            </p>
            <h3 className="text-2xl font-semibold tracking-[-0.035em] text-divlab-text">
              {profileHighlights.philosophy.value}
            </h3>
            <p className="mt-4 text-sm leading-6 text-divlab-text-secondary">
              {profileHighlights.philosophy.detail}
            </p>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1">
        {compactHighlights.map((highlight) => (
          <article key={highlight.title} className="divlab-card p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-xl border divlab-border-neutral divlab-inset p-2.5 text-divlab-text-secondary">
                <AccountIcon name={highlight.icon} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
                  {highlight.title}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-divlab-text">
                  {highlight.value}
                </h3>
                <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
                  {highlight.detail}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <article className="divlab-card xl:col-span-2 divlab-inset p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-fit rounded-xl border divlab-border-neutral bg-divlab-card p-2.5 text-divlab-text-secondary">
            <AccountIcon name={profileHighlights.favoriteQuote.icon} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
              {profileHighlights.favoriteQuote.title}
            </p>
            <blockquote className="mt-3 max-w-4xl text-base leading-7 text-divlab-text-secondary">
              &quot;{profileHighlights.favoriteQuote.value}&quot;
            </blockquote>
            <p className="mt-3 text-sm text-divlab-text-muted">
              {profileHighlights.favoriteQuote.detail}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
