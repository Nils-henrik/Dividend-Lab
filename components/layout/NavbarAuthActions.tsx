import Link from "next/link";
import type { AuthenticatedUser } from "@/lib/auth/user";

type Props = {
  user: AuthenticatedUser | null;
};

const primaryActionClassName =
  "divlab-btn-primary rounded-xl px-6 py-3 text-sm font-semibold";

const secondaryActionClassName =
  "rounded-xl border divlab-border-neutral px-6 py-3 text-sm text-divlab-text-secondary transition duration-300 hover:border-divlab-border-strong hover:text-divlab-text";

export default function NavbarAuthActions({ user }: Props) {
  if (user) {
    return (
      <Link href="/dashboard" className={primaryActionClassName}>
        Logga in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Link href="/login" className={secondaryActionClassName}>
        Logga in
      </Link>
      <Link href="/register" className={primaryActionClassName}>
        Skapa konto
      </Link>
    </div>
  );
}
