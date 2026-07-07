import ProfileEditForm from "@/components/account/ProfileEditForm";
import AppShell from "@/components/layout/AppShell";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import { profileToFormValues } from "@/lib/profiles/profile";

export default async function EditProfilePage() {
  const { user, profile, identity } = await requireAuthenticatedUserWithProfile();

  return (
    <AppShell user={user} identity={identity}>
      <ProfileEditForm
        initialValues={profileToFormValues(profile)}
        avatarUrl={identity.avatarUrl}
        initials={identity.initials}
      />
    </AppShell>
  );
}
