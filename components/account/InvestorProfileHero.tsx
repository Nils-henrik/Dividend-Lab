import Link from "next/link";
import { investorIdentity } from "@/data/account";

export default function InvestorProfileHero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
      <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-[#D4AF37]/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-7 md:flex-row md:items-center">
          <div className="flex flex-col items-start gap-4">
            <div className="relative">
              <div className="absolute inset-[-10px] rounded-full border border-[#D4AF37]/10 bg-[#D4AF37]/[0.03]" />
              <div className="absolute inset-[-18px] rounded-full bg-[radial-gradient(circle,rgba(212,175,55,0.18),transparent_62%)]" />
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-[#D4AF37]/35 bg-gradient-to-br from-[#D4AF37]/20 via-white/[0.04] to-[#050505] text-3xl font-semibold tracking-[-0.04em] text-[#F9D976] shadow-[0_0_34px_rgba(212,175,55,0.1)]">
                {investorIdentity.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={investorIdentity.avatarUrl}
                    alt={`${investorIdentity.fullName} avatar`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <span className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(249,217,118,0.22),transparent_36%)]" />
                    <span className="absolute inset-x-6 top-4 h-px bg-[#F9D976]/25" />
                    <span className="relative">
                      {investorIdentity.initials}
                    </span>
                  </>
                )}
              </div>
            </div>

            <Link
              href="/account/edit"
              className="rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.16)] transition-all duration-300 hover:bg-[#F9D976] hover:shadow-[0_0_34px_rgba(212,175,55,0.22)]"
            >
              Edit Profile
            </Link>
          </div>

          <div>
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
              Investor Identity
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
              {investorIdentity.fullName}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span>@{investorIdentity.username}</span>
              <span className="h-1 w-1 rounded-full bg-gray-600" />
              <span>{investorIdentity.memberSince}</span>
            </div>
            <div className="mt-7 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-500">
                Biography
              </p>
              <p className="mt-3 text-base leading-7 text-gray-300">
                {investorIdentity.bio}
              </p>
            </div>
          </div>
        </div>

        <div className="w-fit rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1 text-xs font-medium text-green-400">
          Verified long-term investor
        </div>
      </div>
    </section>
  );
}
