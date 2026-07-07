import { requireAuthenticatedUser } from "@/lib/auth/session";
import type { AuthenticatedUser } from "@/lib/auth/user";
import AppShellClient from "./AppShellClient";

type Props = {
  children: React.ReactNode;
  user?: AuthenticatedUser;
};

export default async function AppShell({ children, user }: Props) {
  const authenticatedUser = user ?? (await requireAuthenticatedUser());

  return <AppShellClient user={authenticatedUser}>{children}</AppShellClient>;
}
