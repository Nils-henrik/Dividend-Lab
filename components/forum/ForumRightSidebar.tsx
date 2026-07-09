import ForumTrending from "./ForumTrending";
import LatestReplies from "./LatestReplies";
import MostHelpful from "./MostHelpful";

export default function ForumRightSidebar() {
  return (
    <aside className="space-y-2">
      <section className="rounded-md border border-[#D4AF37]/20 bg-[#D4AF37]/5 px-2.5 py-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
          Dividend Brain Ready
        </p>
        <p className="mt-1 text-[11px] leading-4 text-gray-300">
          Framtida AI-integration kan rekommendera diskussioner, utbildningsinnehåll
          och trådanalys utifrån denna struktur.
        </p>
      </section>

      <ForumTrending />
      <LatestReplies />
      <MostHelpful />
    </aside>
  );
}
