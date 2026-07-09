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

const forumPrinciples = [
  "Var respektfull.",
  "Håll dig till ämnet.",
  "Förklara hur du tänker.",
  "Skilj på fakta, antaganden och åsikter.",
  "Hjälp andra att bli bättre investerare.",
  "Tolka andra generöst och fråga hellre än att anta.",
];

const forumRules = [
  "Håll en saklig och respektfull ton.",
  "Undvik personangrepp, hån, trakasserier och provocerande beteende.",
  "Posta i rätt kategori och håll tråden nära ämnet.",
  "Skriv rubriker som tydligt beskriver vad tråden handlar om.",
  "Dela gärna källor när du gör påståenden om bolag, marknader, utdelningar eller strategier.",
  "Pump-and-dump, spam, vilseledande marknadsföring och dold reklam är inte tillåtet.",
  "Publicera inte privata uppgifter om andra personer.",
  "Forumet är till för utbildning och diskussion, inte personliga köp- eller säljråd.",
  "Kritik är välkommen när den är saklig. Bråk för bråkets skull är det inte.",
  "Om något bryter mot reglerna ska det kunna hanteras av DivLab-teamet. Tills rapporteringsfunktionen finns på plats bör konflikter inte eldas på i tråden.",
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
          <section className="divlab-card p-6">
            <p className="divlab-section-label">
              Välkommen
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
              Välkommen till forumet
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-300">
              Forumet är DivLabs plats för långsiktiga investerare att
              diskutera, ställa frågor och lära av varandra. Här premieras
              saklighet, nyfikenhet, respekt och resonemang som hjälper andra
              att förstå.
            </p>
          </section>

          <section className="divlab-surface-panel p-6">
            <h2 className="text-sm font-semibold text-white">
              Forumets grundprinciper
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {forumPrinciples.map((principle) => (
                <div
                  key={principle}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <p className="text-sm leading-6 text-gray-300">{principle}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="divlab-surface-panel p-6">
            <h2 className="text-sm font-semibold text-white">
              Uppföranderegler
            </h2>
            <ol className="mt-4 space-y-3 text-sm leading-6 text-gray-300">
              {forumRules.map((rule, index) => (
                <li key={rule} className="flex gap-3">
                  <span className="mt-0.5 shrink-0 tabular-nums text-[11px] font-medium text-gray-500">
                    {index + 1}.
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="divlab-surface-panel p-6">
            <h2 className="text-sm font-semibold text-white">
              Alla börjar någonstans
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
              Alla investerare har varit nybörjare. Frågor som ställs med en
              ärlig vilja att förstå är välkomna här. Det finns inga dumma
              frågor när målet är att lära sig, men försök gärna beskriva vad
              du redan har funderat på så blir svaren bättre.
            </p>
          </section>

          <section className="divlab-surface-panel p-6">
            <h2 className="text-sm font-semibold text-white">
              Ekonomiska diskussioner
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
              Diskussioner i forumet kan handla om aktier, fonder, utdelningar,
              strategier och privatekonomi. Inlägg ska ses som utbildning,
              erfarenhetsutbyte och diskussion mellan medlemmar. De ska inte
              tolkas som individuell finansiell rådgivning eller som
              uppmaningar att köpa eller sälja värdepapper.
            </p>
          </section>

          <section className="divlab-surface-panel p-6">
            <h2 className="text-sm font-semibold text-white">Vid missbruk</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
              För att skydda forumets kvalitet kan inlägg redigeras, döljas
              eller tas bort. Konton kan få en varning, begränsas eller stängas
              av vid upprepade eller allvarliga överträdelser. Målet är inte
              att straffa, utan att hålla forumet användbart, tryggt och
              värdefullt för seriösa medlemmar.
            </p>
          </section>

          <section className="divlab-surface-panel p-6">
            <h2 className="text-sm font-semibold text-white">DivLab-kulturen</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-300">
              Det bästa inlägget är inte alltid det som har starkast åsikt, utan
              det som hjälper andra att tänka klarare. DivLab ska vara en plats
              där långsiktiga investerare blir bättre tillsammans.
            </p>
          </section>

          <section className="divlab-surface-panel p-6">
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
                  className="divlab-btn-ghost inline-flex shrink-0 px-5 py-2.5 text-sm"
                >
                  Gå till diskussioner
                </Link>
              ) : (
                <Link
                  href={`/login?redirect=${encodeURIComponent("/forum?category=stocks")}`}
                  className="divlab-btn-secondary inline-flex shrink-0 px-5 py-2.5 text-sm transition hover:border-divlab-blue/30 hover:text-divlab-blue-muted"
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
