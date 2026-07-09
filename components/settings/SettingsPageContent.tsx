import ChangePasswordForm from "./ChangePasswordForm";

export default function SettingsPageContent() {
  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Dividend Lab
        </p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
          Inställningar
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
          Kontoinställningar
        </p>
      </section>

      <ChangePasswordForm />
    </div>
  );
}
