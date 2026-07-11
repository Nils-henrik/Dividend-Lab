import { Suspense } from "react";
import MarketingPreviewChart from "./MarketingPreviewChart";
import MarketingPreviewNews from "./MarketingPreviewNews";
import MarketingPreviewNewsFallback from "./MarketingPreviewNewsFallback";

function PreviewTile({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border divlab-border-neutral bg-white/[0.02] px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
        {title}
      </p>
      <p className="mt-2 text-sm font-medium text-divlab-text-secondary">
        {value}
      </p>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="w-full">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-divlab-text-muted">
            Översikt
          </p>
          <p className="mt-1 text-xs text-divlab-text-secondary">DivLab</p>
        </div>
        <span className="rounded-md border divlab-border-neutral px-2 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-divlab-text-muted">
          Exempelvy
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <PreviewTile title="Marknadsläge" value="Blandat läge" />
        <PreviewTile title="Portföljöversikt" value="12 innehav" />
        <PreviewTile title="Bevakningslista" value="8 bolag" />
        <PreviewTile title="Forumdiskussioner" value="Senaste trådar" />
      </div>

      <div className="mt-4 rounded-lg border divlab-border-neutral bg-white/[0.02] p-4">
        <p className="text-xs font-medium text-divlab-text-secondary">
          Marknadstrend
        </p>
        <p className="text-[10px] text-divlab-text-muted">Exempeldata</p>
        <MarketingPreviewChart />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3">
        <Suspense fallback={<MarketingPreviewNewsFallback />}>
          <MarketingPreviewNews />
        </Suspense>
        <div className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-3">
          <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
            Forumdiskussioner
          </p>
          <p className="mt-2 text-sm text-divlab-text-secondary">
            Hur tänker ni kring fastighetssektorn?
          </p>
        </div>
      </div>
    </div>
  );
}
