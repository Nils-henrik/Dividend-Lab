export default function MarketingPreviewNewsFallback() {
  return (
    <div className="rounded-lg border divlab-border-neutral bg-white/[0.02] p-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-text-muted">
        Senaste nytt
      </p>

      <div
        className="mt-2 min-h-[104px] divide-y divide-white/[0.06]"
        aria-hidden="true"
      >
        {[0, 1].map((index) => (
          <div key={index} className="py-2.5 first:pt-0 last:pb-0">
            <div className="h-4 w-full max-w-[92%] rounded bg-white/[0.06]" />
            <div className="mt-2 h-2.5 w-28 rounded bg-white/[0.04]" />
          </div>
        ))}
      </div>
    </div>
  );
}
