import Link from "next/link";
import { forumDiscussions } from "@/data/dashboard";

export default function ForumPreview() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
            Community
          </p>
          <h2 className="text-lg font-semibold text-white">Utforska forumet</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Läs diskussioner från andra utdelningsinvesterare. Ställ en fråga
            när du är redo.
          </p>
        </div>
        <Link
          href="/forum"
          className="shrink-0 rounded-xl border border-[#D4AF37]/40 px-3 py-2 text-xs font-semibold text-[#D4AF37] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/10"
        >
          Till forumet
        </Link>
      </div>

      <div className="space-y-3">
        {forumDiscussions.map((discussion) => (
          <div
            key={discussion.title}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <p className="text-sm font-medium leading-6 text-white">
              {discussion.title}
            </p>
            <div className="mt-3 flex justify-between text-xs text-gray-500">
              <span>{discussion.replies} svar</span>
              <span>{discussion.activity}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
