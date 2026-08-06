import type { ReactNode } from "react";
import type { AuthenticatedUser } from "@/lib/auth/user";
import AppShell from "@/components/layout/AppShell";
import PublicPageShell from "@/components/layout/PublicPageShell";

type Props = {
  user: AuthenticatedUser | null;
  children: ReactNode;
};

export default function ForumRouteShell({ user, children }: Props) {
  if (user) {
    return <AppShell user={user}>{children}</AppShell>;
  }

  return (
    <PublicPageShell contentClassName="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {children}
    </PublicPageShell>
  );
}
