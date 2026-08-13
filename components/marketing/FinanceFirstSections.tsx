import Link from "next/link";
import AppIcon from "@/components/layout/AppIcon";
import { formatSek } from "@/lib/dashboard/fire-calculator";

const swedishContextItems = [
  "ISK och KF",
  "Pension",
  "Indexfonder",
  "Sparkvot",
  "FIRE",
  "Svenska börsnyheter",
] as const;

function Heading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-2xl">
      <p className="divlab-section-label text-[10px] tracking-[0.22em]">{eyebrow}</p>
      <h2 className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl">{title}</h2>
      <p className="mt-2.5 text-sm leading-6 text-divlab-text-secondary sm:text-base sm:leading-7">{description}</p>
    </div>
  );
}

export default function FinanceFirstSections() {
  return (
    <>
      <section className="border-t divlab-border-neutral bg-divlab-bg">
        <div className="mx-auto grid max-w-7xl gap-4 px-6 py-12 md:px-8 md:py-14 lg:grid-cols-2 lg:gap-5 lg:items-stretch">
          <div className="rounded-xl border divlab-border-neutral bg-white/[0.02] p-5">
            <Heading eyebrow="Frihetsmaskinen" title="Vägen mot ekonomisk frihet" description="Testa hur kapital, sparkvot och avkastningsantaganden påverkar tidslinjen. Justera siffrorna utifrån din egen situation." />
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4 border-b divlab-border-neutral pb-2"><dt className="text-divlab-text-secondary">Kapital</dt><dd className="tabular-nums text-divlab-text">{formatSek(250_000)}</dd></div>
              <div className="flex justify-between gap-4 border-b divlab-border-neutral pb-2"><dt className="text-divlab-text-secondary">Månadssparande</dt><dd className="tabular-nums text-divlab-text">{formatSek(5_000)}</dd></div>
              <div className="flex justify-between gap-4"><dt className="text-divlab-text-secondary">Önskad månadsutdelning</dt><dd className="tabular-nums text-divlab-text">{formatSek(25_000)}</dd></div>
            </dl>
            <p className="mt-3.5 text-sm leading-6 text-divlab-text-secondary">Resultatet beror på dina egna antaganden. Det är en uppskattning, inte ett löfte.</p>
            <Link href="/frihetsmaskinen#kalkylator" className="divlab-btn-primary mt-4 inline-flex min-h-11 items-center px-6 py-3 text-sm font-semibold">Öppna Frihetsmaskinen</Link>
          </div>

          <div className="rounded-xl border divlab-border-neutral bg-white/[0.02] p-5">
            <Heading eyebrow="Svensk kontext" title="Byggt för svenska sparare" description="DivLab utgår från svensk privatekonomi och svenska sparares vardag — från kontotyper och pension till långsiktigt investerande." />
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {swedishContextItems.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm leading-6 text-divlab-text-secondary">
                  <AppIcon name="check" className="h-3.5 w-3.5 shrink-0 text-divlab-blue" strokeWidth={1.75} />{item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="experiment-heading" className="border-t divlab-border-neutral bg-divlab-bg">
        <div className="mx-auto max-w-7xl px-6 py-12 md:px-8 md:py-14">
          <div className="rounded-2xl border divlab-border-neutral bg-white/[0.02] p-5 sm:p-6 lg:grid lg:grid-cols-[1.25fr_0.75fr] lg:gap-10 lg:p-7">
            <div>
              <p className="divlab-section-label text-[10px] tracking-[0.22em]">Pågående experiment</p>
              <h2 id="experiment-heading" className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl">Kan en AI slå index över tid?</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary sm:text-base sm:leading-7">
                DivLab testar fyra publika modellportföljer för att se hur en AI-baserad analysprocess klarar sig över tid. Beslut, affärer och resultat visas öppet — även när utfallet är svagt.
              </p>
              <p className="mt-3 text-xs leading-5 text-divlab-text-muted">Simulerade modellportföljer · allmän information, inte personlig investeringsrådgivning.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link href="/portfolios" className="divlab-btn-primary inline-flex min-h-11 items-center justify-center px-6 py-3 text-sm font-semibold">Följ experimentet</Link>
                <Link href="/portfolios/sa-fungerar-ai-processen" className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-6 py-3 text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text">Så arbetar processen</Link>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:mt-0 lg:grid-cols-1">
              <div className="rounded-xl border divlab-border-neutral bg-black/10 p-4"><div className="flex items-center gap-3"><AppIcon name="pieChart" className="h-6 w-6 text-divlab-blue" strokeWidth={1.75} /><p className="text-sm font-semibold text-divlab-text">4 modellportföljer</p></div><p className="mt-2 text-sm leading-6 text-divlab-text-secondary">Olika risknivåer och strategier följs över tid.</p></div>
              <div className="rounded-xl border divlab-border-neutral bg-black/10 p-4"><div className="flex items-center gap-3"><AppIcon name="shield" className="h-6 w-6 text-divlab-blue" strokeWidth={1.75} /><p className="text-sm font-semibold text-divlab-text">Öppen historik</p></div><p className="mt-2 text-sm leading-6 text-divlab-text-secondary">Beslut och resultat ligger kvar för att kunna granskas i efterhand.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t divlab-border-neutral bg-divlab-bg">
        <div className="relative mx-auto max-w-3xl overflow-hidden px-6 py-12 text-center md:px-8 md:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(0,132,255,0.12),transparent_55%)]" />
          <div className="relative">
            <h2 className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl">Gör DivLab till din plats för börsen</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-divlab-text-secondary sm:text-base sm:leading-7">Skapa ett gratis konto för att delta i diskussioner och bygga din personliga DivLab-miljö. Gratis under betan.</p>
            <div className="mt-5 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/register" className="divlab-btn-primary inline-flex min-h-11 items-center justify-center px-8 py-3.5 text-base font-semibold">Skapa gratis konto</Link>
              <Link href="/about" className="inline-flex min-h-11 items-center justify-center rounded-xl border divlab-border-neutral px-6 py-3.5 text-sm font-medium text-divlab-text-secondary transition hover:border-divlab-border-strong hover:text-divlab-text">Om DivLab</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
