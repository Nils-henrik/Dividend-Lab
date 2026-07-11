import type { ReactNode } from "react";
import type { AuthenticatedUser } from "@/lib/auth/user";
import AppShell from "@/components/layout/AppShell";

type Props = {
  user: AuthenticatedUser | null;
  children: ReactNode;
};

export default function ForumRouteShell({ user, children }: Props) {
  if (user) {
    return <AppShell user={user}>{children}</AppShell>;
  }

  return (
    <main className="min-h-screen bg-divlab-bg text-divlab-text">
      <div className="px-8 py-8">{children}</div>
    </main>
  );
}
