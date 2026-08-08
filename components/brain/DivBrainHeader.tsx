export default function DivBrainHeader() {
  return (
    <header className="px-1 sm:px-2">
      <div className="flex flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-3xl">
            DivBrain
          </h1>
          <span className="rounded-md border border-divlab-blue/25 bg-divlab-blue/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-divlab-blue">
            Intern Alpha
          </span>
        </div>
        <p className="max-w-2xl text-xs leading-5 text-divlab-text-secondary sm:text-sm">
          Svensk förklaring och finansiell förståelse med tydliga gränser. Ingen personlig rådgivning.
        </p>
      </div>
    </header>
  );
}
