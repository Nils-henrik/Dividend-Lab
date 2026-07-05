export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-6">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-bold text-[#D4AF37]">DL</span>

          <h1 className="text-xl font-semibold tracking-[0.3em] text-white">
            DIVIDEND <span className="text-[#D4AF37]">LAB</span>
          </h1>
        </div>

        {/* Navigation */}
        <nav className="hidden gap-12 text-white lg:flex">
          <a href="#" className="transition hover:text-[#D4AF37]">
            Funktioner
          </a>

          <a href="#" className="transition hover:text-[#D4AF37]">
            Så fungerar det
          </a>

          <a href="#" className="transition hover:text-[#D4AF37]">
            Om oss
          </a>

          <a href="#" className="transition hover:text-[#D4AF37]">
            Forum
          </a>
        <button className="rounded-xl border border-[#D4AF37] px-6 py-3 text-[#D4AF37] transition duration-300 hover:bg-[#D4AF37] hover:text-black">
  Logga in
</button>
</nav>
      </div>
    </header>
  );
}