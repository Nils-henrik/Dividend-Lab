export default function EditProfilePlaceholder() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Investeraridentitet
        </p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
          Redigera profil
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
          Hantera din offentliga investerarprofil.
        </p>
      </section>

      <section className="flex justify-center">
        <article className="relative w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#161616] p-8 text-center shadow-[0_0_80px_rgba(212,175,55,0.05)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-44 w-44 -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-3xl" />

          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[#D4AF37]">
              Profilredigering
            </p>
            <h3 className="mt-5 text-2xl font-semibold tracking-[-0.035em] text-white">
              Profilredigering kommer snart.
            </h3>
            <div className="mx-auto mt-5 max-w-2xl space-y-4 text-sm leading-7 text-gray-400">
              <p>
                Dividend Lab kommer snart att låta dig anpassa din offentliga
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
              className="mt-8 cursor-not-allowed rounded-xl border border-[#D4AF37]/60 bg-[#D4AF37] px-8 py-3 text-sm font-semibold text-black opacity-70 shadow-[0_0_30px_rgba(212,175,55,0.16)]"
            >
              Kommer snart
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
