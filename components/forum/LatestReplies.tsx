import { latestReplies } from "@/data/forum";

export default function LatestReplies() {
  return (
    <section className="rounded-md border border-white/10 bg-[#161616] px-2.5 py-2">
      <h2 className="text-xs font-semibold text-white">Senaste svaren</h2>
      {latestReplies.length === 0 ? (
        <p className="mt-2 text-[11px] leading-4 text-gray-500">
          Inga svar än.
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          {latestReplies.map((reply) => (
            <div
              key={`${reply.threadTitle}-${reply.user}`}
              className="border-b border-white/10 pb-2 last:border-0 last:pb-0"
            >
              <p className="text-xs leading-4 text-gray-300">
                {reply.threadTitle}
              </p>
              <p className="mt-0.5 text-[11px] text-gray-500">
                {reply.user} · {reply.activity}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
