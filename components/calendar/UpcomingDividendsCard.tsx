import type { UpcomingDividendPayment } from "@/types/calendar";

type Props = {
  payments: UpcomingDividendPayment[];
};

export default function UpcomingDividendsCard({ payments }: Props) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#111111]/80 p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gray-500">
        Upcoming Dividends
      </p>

      <div className="mt-3 space-y-2">
        {payments.map((payment) => (
          <article
            key={payment.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-2.5 transition-all duration-300 hover:border-[#D4AF37]/25"
          >
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-600">
                {payment.dayLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {payment.company}
              </p>
            </div>
            <p className="text-sm font-medium text-green-400 tabular-nums">
              {payment.amount}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
