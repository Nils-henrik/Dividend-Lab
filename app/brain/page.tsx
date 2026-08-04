import AppShell from "@/components/layout/AppShell";
import PlaceholderPage from "@/components/dashboard/PlaceholderPage";
import DivBrainShell from "@/components/brain/DivBrainShell";
import { requireAuthenticatedUserWithProfile } from "@/lib/auth/session";
import { resolveDivBrainAlphaPageAccess } from "@/lib/divbrain/server/access";
import {
  createDivBrainRuntimeRepository,
  createDivBrainShellDiagnosticLogger,
  createOnceDivBrainShellDiagnosticSink,
  divBrainShellDataUnavailable,
  loadDivBrainShellData,
  type DivBrainShellViewModel,
} from "@/lib/divbrain/server/ui";

type BrainPageSearchParams = {
  conversation?: string | string[];
};

type Props = {
  searchParams: Promise<BrainPageSearchParams>;
};

function readConversationParam(
  searchParams: BrainPageSearchParams,
): string | null {
  const value = searchParams.conversation;
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0];
  }
  return null;
}

export default async function DivBrainPage({ searchParams }: Props) {
  const { user, identity } = await requireAuthenticatedUserWithProfile();
  const access = await resolveDivBrainAlphaPageAccess({ actorId: user.id });

  if (access.status === "unavailable") {
    return (
      <AppShell user={user} identity={identity}>
        <PlaceholderPage
          title="DivBrain är inte tillgängligt"
          description="DivBrain är inte tillgängligt för det här kontot. DivBrain testas just nu i en begränsad intern Alpha."
        />
      </AppShell>
    );
  }

  const resolvedSearchParams = await searchParams;
  const selectedConversationId = readConversationParam(resolvedSearchParams);

  // Server-only fixed-category diagnostics for Vercel runtime logs.
  // Never passed to the browser view model.
  const diagnose = createOnceDivBrainShellDiagnosticSink(
    createDivBrainShellDiagnosticLogger(),
  );

  let view: DivBrainShellViewModel = divBrainShellDataUnavailable();
  const repositoryResult = createDivBrainRuntimeRepository({ diagnose });

  if (!repositoryResult.ok) {
    view = divBrainShellDataUnavailable();
  } else {
    view = await loadDivBrainShellData({
      actorId: user.id,
      selectedConversationId,
      repository: repositoryResult.data,
      diagnose,
    });
  }

  return (
    <AppShell user={user} identity={identity}>
      <DivBrainShell view={view} />
    </AppShell>
  );
}
