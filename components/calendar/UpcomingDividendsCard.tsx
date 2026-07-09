import type { UpcomingDividendPayment } from "@/types/calendar";

type Props = {
  payments: UpcomingDividendPayment[];
};

export default function UpcomingDividendsCard({ payments }: Props) {
  return (
    <section className="divlab-card p-4">
      <p className="divlab-section-label text-[10px] tracking-[0.2em]">
        Kommande utdelningar
      </p>

      <div className="mt-3 space-y-2">
        {payments.map((payment) => (
          <article
            key={payment.id}
            className="flex items-center justify-between gap-4 rounded-xl border divlab-border-neutral bg-divlab-surface px-3.5 py-2.5 transition-all duration-300 hover:border-divlab-blue/25"
          >
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-divlab-text-subtle">
                {payment.dayLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-divlab-text">
                {payment.company}
              </p>
            </div>
            <p className="text-sm font-medium text-divlab-green tabular-nums">
              {payment.amount}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
