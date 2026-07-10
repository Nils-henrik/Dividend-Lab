import Link from "next/link";
import type { AuthenticatedUser } from "@/lib/auth/user";
import type { UserDisplayIdentity } from "@/lib/profiles/identity";
import type { StaffRole } from "@/lib/profiles/staff-roles";
import type { UserProfile } from "@/lib/profiles/types";
import StaffRoleBadges from "@/components/profile/StaffRoleBadges";
import ProfileAvatar from "./ProfileAvatar";

type Props = {
  user: AuthenticatedUser;
  profile: UserProfile;
  identity: UserDisplayIdentity;
  staffRoles: StaffRole[];
};

function formatMemberSince(createdAt: string | null) {
  if (!createdAt) {
    return "Kontots skapelsedatum är inte tillgängligt";
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "Kontots skapelsedatum är inte tillgängligt";
  }

  return new Intl.DateTimeFormat("sv", {
    month: "long",
    year: "numeric",
  }).format(createdDate);
}

function EmptyField({ children }: { children: React.ReactNode }) {
  return <span className="text-divlab-text-muted">{children}</span>;
}

function DefinitionRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="divlab-definition-row">
      <p className="divlab-definition-label">{label}</p>
      <div className="divlab-definition-value">{children}</div>
    </div>
  );
}

export default function AccountOverview({
  user,
  profile,
  identity,
  staffRoles,
}: Props) {
  const memberSince = formatMemberSince(user.createdAt);
  const hasPublicProfile =
    profile.displayName ||
    profile.username ||
    profile.bio ||
    profile.favoriteSector ||
    profile.investorGoal;

  return (
    <div className="space-y-6">
      <section className="divlab-hero">
        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <ProfileAvatar
                  avatarUrl={identity.avatarUrl}
                  initials={identity.initials}
                  sizeClassName="h-28 w-28"
                  textClassName="text-3xl tracking-[-0.04em]"
                  highlighted
                />

            <div className="min-w-0">
              <p className="mb-3 divlab-section-label">Investeraridentitet</p>
              <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
                {identity.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-divlab-text-secondary">
                <span>
                  {identity.username
                    ? `@${identity.username}`
                    : "Inget offentligt användarnamn valt ännu"}
                </span>
                <span className="h-1 w-1 rounded-full bg-divlab-text-subtle" />
                <span>Medlem sedan {memberSince}</span>
              </div>
              <StaffRoleBadges roles={staffRoles} className="mt-3" />
              <p className="mt-5 max-w-3xl text-sm leading-7 text-divlab-text-secondary">
                {hasPublicProfile
                  ? "Din Dividend Lab-profil är redo för kommande community-funktioner."
                  : "Din investerarprofil är inte färdig ännu. Fyll i din investeraridentitet för att anpassa din Dividend Lab-profil."}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <span className="rounded-full border border-divlab-blue/25 bg-divlab-blue/10 px-3 py-1 text-xs font-medium text-divlab-blue-muted">
              Verifierat konto
            </span>
            <Link href="/account/edit" className="divlab-btn-primary px-5 py-2.5">
              Redigera profil
            </Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <article className="divlab-card p-6">
          <p className="mb-3 divlab-section-label">Kontouppgifter</p>
          <h3 className="text-lg font-semibold text-divlab-text">
            Konto och offentlig profil
          </h3>
          <div className="divlab-definition-list mt-6">
            <DefinitionRow label="Privat e-postadress">
              <span className="break-all">{user.email}</span>
            </DefinitionRow>
            <DefinitionRow label="Offentligt användarnamn">
              {profile.username ? (
                `@${profile.username}`
              ) : (
                <EmptyField>
                  Välj ett offentligt användarnamn innan du deltar i diskussioner.
                </EmptyField>
              )}
            </DefinitionRow>
            <DefinitionRow label="Konto skapat">{memberSince}</DefinitionRow>
          </div>
        </article>

        <article className="divlab-card p-6">
          <p className="mb-3 divlab-section-label">Profilinställning</p>
          <h3 className="text-lg font-semibold text-divlab-text">
            Investeraridentitet
          </h3>
          <div className="divlab-definition-list mt-6">
            <DefinitionRow label="Visningsnamn">
              {profile.displayName ?? (
                <EmptyField>Lägg till ett visningsnamn för din profil.</EmptyField>
              )}
            </DefinitionRow>
            <DefinitionRow label="Bio">
              {profile.bio ?? (
                <EmptyField>
                  Lägg till en kort bio för att anpassa din Dividend Lab-identitet.
                </EmptyField>
              )}
            </DefinitionRow>
            <DefinitionRow label="Favoritsektor">
              {profile.favoriteSector ?? (
                <EmptyField>Ingen favoritsektor vald ännu.</EmptyField>
              )}
            </DefinitionRow>
            <DefinitionRow label="Investeringsmål">
              {profile.investorGoal ?? (
                <EmptyField>Inget investeringsmål tillagt ännu.</EmptyField>
              )}
            </DefinitionRow>
          </div>
        </article>
      </section>
    </div>
  );
}
