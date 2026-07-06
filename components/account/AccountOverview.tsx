import { accountSections } from "@/data/account";

export default function AccountOverview() {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Account Center
        </p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
          Account Overview
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
          A structured placeholder for profile, subscription, billing, payment,
          security and notification settings.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {accountSections.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-white/10 bg-[#161616] p-6"
          >
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white">
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">
                {section.description}
              </p>
            </div>

            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-300">
                    {item}
                  </span>
                  <span className="text-xs uppercase tracking-[0.16em] text-gray-500">
                    Placeholder
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
