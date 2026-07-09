import Link from "next/link";
import type { ForumCategoryGroup } from "@/types/forum";
import ForumBreadcrumbs from "./ForumBreadcrumbs";
import ForumCategoryItem from "./ForumCategoryItem";
import ForumRightSidebar from "./ForumRightSidebar";
import ForumSidebar from "./ForumSidebar";

type Props = {
  categoryGroups: ForumCategoryGroup[];
  isAuthenticated?: boolean;
};

const forumRules = [
  "Håll en respektfull ton.",
  "Skriv sakligt och hjälp andra förstå ditt resonemang.",
  "Dela gärna källor när du gör påståenden.",
  "Inga personangrepp, spam, pump-and-dump eller vilseledande marknadsföring.",
  "Forumet är till för utbildning och diskussion, inte personliga köp- eller säljråd.",
];

export default function ForumWelcomePage({
  categoryGroups,
  isAuthenticated = false,
}: Props) {
  return (
    <div className="space-y-3">
      <ForumBreadcrumbs items={[{ label: "Forum" }]} />

      <div className="grid gap-4 2xl:grid-cols-[230px_minmax(0,1fr)_290px]">
        <ForumSidebar categoryGroups={categoryGroups} activeCategorySlug="" />

        <main className="space-y-3">
          <section className="rounded-lg border border-white/10 bg-[#111111]/85 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
              Välkommen
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Välkommen till forumet
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-300">
              Forumet är Dividend Labs plats för långsiktiga investerare att
              diskutera, ställa frågor och lära av varandra. Här premieras
              saklighet, nyfikenhet och respekt.
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#161616] p-6">
            <h2 className="text-sm font-semibold text-white">
              Uppföranderegler
            </h2>
            <ul className="mt-4 space-y-2.5 text-sm leading-6 text-gray-300">
              {forumRules.map((rule) => (
                <li key={rule} className="flex gap-2.5">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#D4AF37]/70" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#161616] p-6">
            <h2 className="text-sm font-semibold text-white">
              Alla börjar någonstans
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
              Frågor som ställs med en ärlig vilja att förstå är välkomna. Det
              finns inga dumma frågor när intentionen är att lära.
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#161616] p-6">
            <h2 className="text-sm font-semibold text-white">Vid missbruk</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
              Vid missbruk kan inlägg tas bort, konton varnas och vid upprepade
              eller allvarliga överträdelser kan åtkomsten till forumet
              begränsas.
            </p>
          </section>

          <section className="rounded-lg border border-white/10 bg-[#161616] p-6">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-sm font-semibold text-white">
                  Utforska kategorier
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                  Välj ett område nedan för att läsa eller starta diskussioner.
                </p>
              </div>
              {isAuthenticated ? (
                <Link
                  href={`/forum?category=${categoryGroups[0]?.categories[0]?.slug ?? "stocks"}`}
                  className="inline-flex shrink-0 rounded-xl border border-[#D4AF37]/40 px-5 py-2.5 text-sm font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  Gå till diskussioner
                </Link>
              ) : (
                <Link
                  href={`/login?redirect=${encodeURIComponent("/forum?category=stocks")}`}
                  className="inline-flex shrink-0 rounded-xl border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-300 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  Logga in för att delta
                </Link>
              )}
            </div>

            <div className="mt-6 space-y-4">
              {categoryGroups.map((group) => (
                <div key={group.slug}>
                  <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-gray-500">
                    {group.name}
                  </p>
                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {group.categories.map((category) => (
                      <ForumCategoryItem
                        key={category.slug}
                        category={category}
                        isActive={false}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <ForumRightSidebar />
      </div>
    </div>
  );
}
