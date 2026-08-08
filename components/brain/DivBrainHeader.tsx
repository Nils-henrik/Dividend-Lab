export default function DivBrainHeader() {
  return (
    <header className="px-1 py-1 sm:px-2 sm:py-2">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl">
          DivBrain
        </h1>
        <span className="rounded-md border border-divlab-blue/25 bg-divlab-blue/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-divlab-blue">
          Intern Alpha
        </span>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
        Svensk förklaring och finansiell förståelse med tydliga gränser. Ingen
        personlig rådgivning.
      </p>
    </header>
  );
}
