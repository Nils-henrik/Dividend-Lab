export default function DivBrainHeader() {
  return (
    <header className="divlab-card px-5 py-5 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-divlab-text sm:text-4xl">
          DivBrain
        </h1>
        <span className="rounded-md border border-divlab-blue/25 bg-divlab-blue/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-divlab-blue">
          Intern Alpha
        </span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-divlab-text-secondary">
        Svensk förklaring och finansiell förståelse med tydliga gränser. Ingen
        personlig rådgivning.
      </p>
    </header>
  );
}
