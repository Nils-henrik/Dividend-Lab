import AccountEmailField from "./AccountEmailField";
import ChangePasswordForm from "./ChangePasswordForm";

type Props = {
  email: string;
};

export default function SettingsPageContent({ email }: Props) {
  return (
    <div className="space-y-8">
      <section className="divlab-hero">
        <p className="mb-3 divlab-section-label">Konto</p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
          Inställningar
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-divlab-text-secondary">
          Kontoinställningar
        </p>
      </section>

      <AccountEmailField email={email} />
      <ChangePasswordForm />
    </div>
  );
}
