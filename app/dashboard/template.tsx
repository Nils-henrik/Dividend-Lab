"use client";

import { usePathname } from "next/navigation";
import MarketTickerTape from "@/components/dashboard/MarketTickerTape";

type Props = {
  children: React.ReactNode;
};

export default function DashboardTemplate({ children }: Props) {
  const pathname = usePathname();
  const showTicker = pathname === "/dashboard" || pathname === "/dashboard/";

  return (
    <>
      {showTicker && (
        <>
          <div className="absolute left-20 right-0 top-24 z-20 hidden h-[60px] overflow-hidden lg:block xl:right-72">
            <MarketTickerTape />
          </div>
          <div aria-hidden="true" className="hidden h-[74px] lg:block" />
          <div className="mb-8 lg:hidden">
            <MarketTickerTape />
          </div>
        </>
      )}
      {children}
    </>
  );
}
