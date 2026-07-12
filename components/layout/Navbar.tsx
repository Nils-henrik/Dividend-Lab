import Link from "next/link";
import { PUBLIC_NAV_LINKS } from "@/lib/constants/public-navigation";
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
      {PUBLIC_NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="transition hover:text-divlab-blue-muted"
        >
          {link.label}
        </Link>
      ))}

      <NavbarAuthActions user={user} />
    </nav>
  );

  return (
    <header className="sticky top-0 z-50 w-full divlab-shell-header">
      <NavbarMobileMenu user={user} desktopNav={desktopNav} />
    </header>
  );
}
