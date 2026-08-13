import Link from "next/link";
import type { AuthenticatedUser } from "@/lib/auth/user";

type Props = { user: AuthenticatedUser | null };

const primaryActionClassName = "divlab-btn-primary rounded-xl px-6 py-3 text-sm font-semibold";

export default function NavbarAuthActions({ user }: Props) {
  if (user) {
    return <Link href="/dashboard" className={primaryActionClassName}>Öppna DivLab</Link>;
  }
  return <Link href="/login" className={primaryActionClassName}>Logga in</Link>;
}
