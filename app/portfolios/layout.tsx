import type { ReactNode } from "react";

export default function PortfoliosLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        section[class~="bg-divlab-surface/55"][class~="overflow-hidden"][class~="grid"] > div {
          border-left-width: 0 !important;
          border-right-width: 0 !important;
        }
      `}</style>
      {children}
    </>
  );
}
