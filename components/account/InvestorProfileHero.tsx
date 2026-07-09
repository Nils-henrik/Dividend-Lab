import Link from "next/link";
import { investorIdentity } from "@/data/account";

export default function InvestorProfileHero() {
  return (
    <section className="divlab-hero">
      <div className="pointer-events-none absolute left-8 top-6 h-44 w-44 rounded-full bg-divlab-blue/5 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-7 md:flex-row md:items-center">
          <div className="flex flex-col items-start gap-4">
            <div className="relative">
              <div className="absolute inset-[-10px] rounded-full border border-divlab-blue/10 bg-divlab-blue/[0.03]" />
              <div className="absolute inset-[-18px] rounded-full bg-[radial-gradient(circle,rgba(10,132,255,0.12),transparent_62%)]" />
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-divlab-blue/35 bg-gradient-to-br from-divlab-blue/20 via-white/[0.04] to-divlab-bg text-3xl font-semibold tracking-[-0.04em] text-divlab-blue-muted">
                {investorIdentity.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={investorIdentity.avatarUrl}
                    alt={`Profilbild för ${investorIdentity.fullName}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  investorIdentity.initials
                )}
              </div>
            </div>

            <Link href="/account/edit" className="divlab-btn-primary px-5 py-2.5">
              Redigera profil
            </Link>
          </div>

          <div>
            <p className="mb-3 divlab-section-label">Investeraridentitet</p>
            <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
              {investorIdentity.fullName}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-divlab-text-secondary">
              <span>@{investorIdentity.username}</span>
              <span className="h-1 w-1 rounded-full bg-divlab-text-subtle" />
              <span>{investorIdentity.memberSince}</span>
            </div>
            <div className="mt-7 max-w-3xl rounded-2xl border divlab-border-neutral divlab-inset px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-divlab-text-muted">
                Biografi
              </p>
              <p className="mt-3 text-base leading-7 text-divlab-text-secondary">
                {investorIdentity.bio}
              </p>
            </div>
          </div>
        </div>

        <div className="w-fit rounded-full border border-divlab-green/20 bg-divlab-green/10 px-3 py-1 text-xs font-medium text-divlab-green">
          Verifierad långsiktig investerare
        </div>
      </div>
    </section>
  );
}
