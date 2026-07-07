import Link from "next/link";

export default function LoginModal() {
  return (
    <Link
      href="/login"
      className="rounded-xl border border-[#D4AF37]/70 px-6 py-3 text-[#D4AF37] transition duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37] hover:text-black"
    >
      Log in
    </Link>
  );
}
