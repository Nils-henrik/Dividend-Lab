import Link from "next/link";
import { getAuthenticatedUser } from "@/lib/auth/session";
import NavbarAuthActions from "./NavbarAuthActions";

export default async function Navbar() {
  const user = await getAuthenticatedUser();

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#090909]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-8">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-[#D4AF37]">DL</span>

          <h1 className="text-lg font-semibold tracking-[0.3em] text-white md:text-xl">
            DIVIDEND <span className="text-[#D4AF37]">LAB</span>
          </h1>
        </div>

        <nav className="hidden items-center gap-10 text-sm font-medium text-gray-300 lg:flex">
          <a href="#" className="transition hover:text-[#D4AF37]">
            Funktioner
          </a>

          <a href="#" className="transition hover:text-[#D4AF37]">
            Så fungerar det
          </a>

          <a href="#" className="transition hover:text-[#D4AF37]">
            Om oss
          </a>

          <Link href="/forum" className="transition hover:text-[#D4AF37]">
            Forum
          </Link>

          <NavbarAuthActions user={user} />
        </nav>
      </div>
    </header>
  );
}