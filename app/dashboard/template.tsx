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
        <div className="mx-auto mb-8 w-full max-w-[1500px]">
          <MarketTickerTape />
        </div>
      )}
      {children}
    </>
  );
}
