import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth/session";
import NavbarAuthActions from "./NavbarAuthActions";
import NavbarMobileMenu from "./NavbarMobileMenu";

export default async function Navbar() {
  const user = await getAuthenticatedUser();

  const desktopNav = (
    <nav
      className="hidden items-center gap-10 text-sm font-medium text-divlab-text-secondary lg:flex"
      aria-label="Primär navigering"
    >
      <a href="#" className="transition hover:text-divlab-blue-muted">
        Funktioner
      </a>

      <a href="#" className="transition hover:text-divlab-blue-muted">
        Så fungerar det
      </a>

      <a href="#" className="transition hover:text-divlab-blue-muted">
        Om oss
      </a>

      <Link href="/forum" className="transition hover:text-divlab-blue-muted">
        Forum
      </Link>

      <NavbarAuthActions user={user} />
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full divlab-shell-header">
      <NavbarMobileMenu user={user} desktopNav={desktopNav} />
    </header>
  );
}
