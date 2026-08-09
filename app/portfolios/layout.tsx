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

        /* Keep the information note in its existing position while updating
           the visible copy requested for the portfolio page. */
        main:has(a[href="#ai-process"]) section:last-child > p {
          font-size: 0;
          line-height: 0;
        }

        main:has(a[href="#ai-process"]) section:last-child > p::after {
          content: "Modellportföljerna uppdateras minst 1 gång per handelsdag. Vid händelser kan AI:n göra riktade omprövningar, med en hård gräns på totalt 4 beslutskörningar per portfölj och dag. Alla genomförda affärer sparas i historiken.";
          display: block;
          font-size: 0.75rem;
          line-height: 1.25rem;
          overflow-wrap: anywhere;
        }

        @media (min-width: 1280px) {
          main:has(a[href="#ai-process"]) {
            overflow-x: visible;
          }
        }
      `}</style>
      {children}
    </>
  );
}
