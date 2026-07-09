const insights = [
  {
    title: "Vad påverkar tiden till frihet mest?",
    body: "Månadssparande och konsekvent tid i marknaden påverkar ofta mer än att jaga några extra procent i direktavkastning tidigt i resan.",
  },
  {
    title: "Direktavkastning och utdelningssäkerhet",
    body: "Hög avkastning kan se lockande ut, men hållbar utdelning bygger lika mycket på kvalitet, kassaflöde och företagens förmåga att behålla utdelningen.",
  },
  {
    title: "Sparandet betyder mer i början",
    body: "När kapitalet fortfarande växer spelar dina egna insättningar en större roll än passiv avkastning. Det gör disciplin extra viktig i startskedet.",
  },
];

export default function EducationalInsightsCard() {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-[#D4AF37]">
        Lär dig mer
      </p>
      <h2 className="text-lg font-semibold text-white">
        Insikter om utdelning och FIRE
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">
        Generella perspektiv för långsiktiga utdelningsinvesterare — utan att
        utgå från din portfölj.
      </p>

      <div className="mt-5 space-y-3">
        {insights.map((insight) => (
          <article
            key={insight.title}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <h3 className="text-sm font-medium text-white">{insight.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">{insight.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
