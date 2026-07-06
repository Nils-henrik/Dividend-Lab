import { profileHighlights } from "@/data/account";
import AccountIcon from "./AccountIcon";

export default function ProfileHighlights() {
  const compactHighlights = [
    profileHighlights.favoriteSector,
    profileHighlights.currentGoal,
  ];

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <article className="rounded-2xl border border-white/10 bg-[#161616] p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/10 p-2.5 text-[#D4AF37]">
            <AccountIcon name={profileHighlights.philosophy.icon} />
          </div>
          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
              {profileHighlights.philosophy.title}
            </p>
            <h3 className="text-2xl font-semibold tracking-[-0.035em] text-white">
              {profileHighlights.philosophy.value}
            </h3>
            <p className="mt-4 text-sm leading-6 text-gray-400">
              {profileHighlights.philosophy.detail}
            </p>
          </div>
        </div>
      </article>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-1">
        {compactHighlights.map((highlight) => (
          <article
            key={highlight.title}
            className="rounded-2xl border border-white/10 bg-[#161616] p-6"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-gray-400">
                <AccountIcon name={highlight.icon} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                  {highlight.title}
                </p>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {highlight.value}
                </h3>
                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {highlight.detail}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <article className="xl:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-fit rounded-xl border border-white/10 bg-[#161616] p-2.5 text-gray-400">
            <AccountIcon name={profileHighlights.favoriteQuote.icon} />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
              {profileHighlights.favoriteQuote.title}
            </p>
            <blockquote className="mt-3 max-w-4xl text-base leading-7 text-gray-300">
              &quot;{profileHighlights.favoriteQuote.value}&quot;
            </blockquote>
            <p className="mt-3 text-sm text-gray-500">
              {profileHighlights.favoriteQuote.detail}
            </p>
          </div>
        </div>
      </article>
    </section>
  );
}
