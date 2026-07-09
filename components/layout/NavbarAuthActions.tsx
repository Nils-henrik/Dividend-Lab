import Link from "next/link";
import type { AuthenticatedUser } from "@/lib/auth/user";

type Props = {
  user: AuthenticatedUser | null;
};

const primaryActionClassName =
  "rounded-xl border border-[#D4AF37]/70 px-6 py-3 text-[#D4AF37] transition duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black";

const secondaryActionClassName =
  "rounded-xl border border-white/10 px-6 py-3 text-gray-300 transition duration-300 hover:border-white/20 hover:text-white";

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
      <Link href="/login" className={primaryActionClassName}>
        Logga in
      </Link>
      <Link href="/register" className={secondaryActionClassName}>
        Skapa konto
      </Link>
    </div>
  );
}
