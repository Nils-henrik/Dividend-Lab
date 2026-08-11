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
        main:has(#ai-process) {
          min-width: 0;
          max-width: 100%;
          overflow-x: hidden;
        }

        main:has(#ai-process) > * {
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

        @media (min-width: 1280px) {
          main:has(#ai-process) {
            overflow-x: visible;
          }
        }
      `}</style>
      {children}
    </>
  );
}
