export default function ProductPreviewPanelFallback() {
  return (
    <div className="w-full max-w-[560px]" aria-hidden="true">
      <div className="mb-5">
        <div className="h-6 w-40 rounded bg-white/[0.08]" />
        <div className="mt-2 h-4 w-72 max-w-full rounded bg-white/[0.04]" />
      </div>

      <div className="space-y-3">
        <div className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-4">
          <div className="h-2.5 w-20 rounded bg-white/[0.06]" />
          <div className="mt-3 flex gap-3">
            <div className="h-[72px] w-[112px] shrink-0 rounded-lg bg-white/[0.05] sm:h-[80px] sm:w-[128px]" />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <div className="h-4 w-full rounded bg-white/[0.06]" />
              <div className="h-4 w-[80%] rounded bg-white/[0.05]" />
              <div className="h-2.5 w-24 rounded bg-white/[0.04]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className="min-h-[7.5rem] rounded-lg border divlab-border-neutral bg-white/[0.02] p-3.5"
            >
              <div className="h-2.5 w-16 rounded bg-white/[0.06]" />
              <div className="mt-3 h-4 w-full rounded bg-white/[0.05]" />
              <div className="mt-2 h-4 w-[75%] rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
