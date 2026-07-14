export default function EditProfilePlaceholder() {
  return (
    <div className="space-y-8">
      <section className="divlab-hero">
        <p className="mb-3 divlab-section-label">Investeraridentitet</p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
          Redigera profil
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-divlab-text-secondary">
          Hantera din offentliga investerarprofil.
        </p>
      </section>

      <section className="flex justify-center">
        <article className="divlab-card relative w-full max-w-3xl overflow-hidden p-8 text-center">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full bg-divlab-blue/5 blur-3xl" />

          <div className="relative">
            <p className="divlab-section-label">Profilredigering</p>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-divlab-text">
              Profilredigering kommer snart.
            </h3>
            <div className="mx-auto mt-5 max-w-2xl space-y-4 text-sm leading-7 text-divlab-text-secondary">
              <p>
                DivLab kommer snart att låta dig anpassa din offentliga
                investerarprofil, profilbild, biografi och synlighetsinställningar.
              </p>
              <p>
                Vi bygger en genomtänkt redigeringsupplevelse som prioriterar
                integritet, enkelhet och långsiktigt investerande.
              </p>
            </div>

            <button
              type="button"
              disabled
              className="divlab-btn-primary mt-8 cursor-not-allowed px-8 py-3 opacity-70"
            >
              Kommer snart
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
