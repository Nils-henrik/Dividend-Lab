type Props = {
  archived?: boolean;
};

export default function DivBrainDisabledComposer({ archived = false }: Props) {
  return (
    <div className="border-t divlab-border-neutral px-4 py-4 sm:px-5">
      <div className="space-y-2">
        <label htmlFor="divbrain-composer" className="sr-only">
          Frågefält (inaktiverat)
        </label>
        <textarea
          id="divbrain-composer"
          disabled
          rows={3}
          placeholder="Frågefunktionen öppnas i nästa steg."
          className="divlab-input min-h-[5.5rem] w-full resize-none cursor-not-allowed opacity-80"
          aria-disabled="true"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-5 text-divlab-text-muted">
            {archived
              ? "Arkiverade konversationer är skrivskyddade. Ingen AI-motor är ansluten ännu."
              : "Ingen AI-motor är ansluten ännu."}
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="divlab-btn-primary min-h-10 cursor-not-allowed px-4 opacity-50"
          >
            Skicka
          </button>
        </div>
      </div>
    </div>
  );
}
