import type { ReactNode } from "react";

export default function PortfoliosLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        section[class~="bg-divlab-surface/55"][class~="overflow-hidden"][class~="grid"] > div {
          border-left-width: 0 !important;
          border-right-width: 0 !important;
        }

        /* Keep the wide transaction table inside its own horizontal scroller.
           A grid item's default min-width is auto, so the 900px table could
           otherwise widen the entire portfolio page on small screens. */
        main:has(a[href="#ai-process"]) {
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
        }

        main:has(a[href="#ai-process"]) > * {
          min-width: 0;
          max-width: 100%;
        }

        #historik,
        #ai-process,
        #ai-process > *,
        #ai-process [class*="grid-cols-"] > * {
          min-width: 0;
          max-width: 100%;
        }

        #historik > div[class*="overflow-x-auto"] {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          overscroll-behavior-x: contain;
        }

        #ai-process p {
          overflow-wrap: anywhere;
        }

        /* The replacement note is rendered by this route layout so the copy
           stays exact without coupling the mobile containment hotfix to the
           model-portfolio data component. */
        main:has(a[href="#ai-process"]) section:last-child {
          display: none;
        }

        @media (min-width: 1280px) {
          main:has(a[href="#ai-process"]) {
            overflow-x: visible;
          }
        }
      `}</style>
      {children}
      <section className="mx-auto mt-5 flex w-full max-w-[1560px] min-w-0 items-start gap-3 border border-divlab-blue/20 bg-divlab-blue/[0.08] px-4 py-3 text-xs leading-5 text-divlab-text-secondary">
        <span className="mt-0.5 shrink-0 text-divlab-blue" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 10v6M12 7h.01" />
          </svg>
        </span>
        <p className="min-w-0 overflow-wrap-anywhere">
          Modellportföljerna uppdateras minst 1 gång per handelsdag. Vid händelser kan AI:n göra riktade omprövningar, med en hård gräns på totalt 4 beslutskörningar per portfölj och dag. Alla genomförda affärer sparas i historiken.
        </p>
      </section>
    </>
  );
}
