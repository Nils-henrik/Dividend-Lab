import { mostHelpfulMembers } from "@/data/forum";

export default function MostHelpful() {
  return (
    <section className="rounded-md border border-white/10 bg-[#161616] px-2.5 py-2">
      <h2 className="text-xs font-semibold text-white">Most Helpful This Week</h2>
      <p className="mt-1 text-[11px] leading-4 text-gray-500">
        Recognition is based on quality contributions, not popularity.
      </p>

      <div className="mt-2 space-y-2">
        {mostHelpfulMembers.map((member) => (
          <div
            key={member.username}
            className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 last:border-0 last:pb-0"
          >
            <div>
              <p className="text-xs font-medium text-white">{member.username}</p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {member.specialty}
              </p>
            </div>
            <span className="rounded border border-[#D4AF37]/20 bg-[#D4AF37]/10 px-1.5 py-0.5 text-[11px] text-[#D4AF37] tabular-nums">
              {member.recognition}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
