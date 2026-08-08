export default function DivBrainHeader() {
  return (
    <header className="px-1 sm:px-2">
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-divlab-blue/25 bg-divlab-blue/10 text-divlab-blue shadow-sm"
              aria-hidden="true"
            >
              ✦
            </span>
            <h1 className="text-2xl font-semibold tracking-[-0.045em] text-divlab-text sm:text-[1.75rem]">
              DivBrain
            </h1>
            <span className="rounded-full border border-divlab-blue/25 bg-divlab-blue/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.17em] text-divlab-blue">
              Intern Alpha
            </span>
          </div>
          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-divlab-text-muted sm:text-[13px]">
            Din svenska AI-assistent för börs, sparande och privatekonomi — med tydliga gränser.
          </p>
        </div>

        <div className="hidden shrink-0 items-center gap-2 pb-1 text-[11px] text-divlab-text-muted xl:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          AI aktiv
        </div>
      </div>
    </header>
  );
}
