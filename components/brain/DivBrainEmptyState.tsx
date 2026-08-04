export default function DivBrainEmptyState() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 px-5 py-10 sm:px-8">
      <div className="max-w-xl">
        <h2 className="text-2xl font-semibold tracking-[-0.03em] text-divlab-text sm:text-3xl">
          DivBrain är redo för nästa steg
        </h2>
        <p className="mt-3 text-sm leading-6 text-divlab-text-secondary">
          Den säkra grunden och den privata konversationslagringen finns på
          plats. Frågefunktionen och AI-motorn kopplas in i kommande steg.
        </p>
      </div>

      <ul className="divlab-inset max-w-xl space-y-2 rounded-2xl px-4 py-4 text-sm leading-6 text-divlab-text-secondary">
        <li>Ingen AI-motor är ansluten.</li>
        <li>Inga livekurser eller marknadsdata används.</li>
        <li>DivBrain ger inte personlig finansiell rådgivning.</li>
      </ul>
    </div>
  );
}
