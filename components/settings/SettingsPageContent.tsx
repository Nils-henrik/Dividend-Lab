import { getAuthenticatedUser } from "@/lib/auth/session";
import { getOwnShareActiveStatus } from "@/lib/messages/chat-bootstrap";
import ActiveStatusSetting from "./ActiveStatusSetting";
import AppearanceSetting from "./AppearanceSetting";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function SettingsPageContent() {
  const user = await getAuthenticatedUser();
  const shareActiveStatus = user
    ? await getOwnShareActiveStatus(user.id)
    : true;

  return (
    <div className="space-y-8">
      <section className="divlab-hero">
        <p className="mb-3 divlab-section-label">Konto</p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
          Inställningar
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-divlab-text-secondary">
          Hantera utseende, integritet och kontosäkerhet.
        </p>
      </section>

      <AppearanceSetting />
      <ActiveStatusSetting initialEnabled={shareActiveStatus} />
      <ChangePasswordForm />
    </div>
  );
}
