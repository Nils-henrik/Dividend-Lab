import { upcomingDividends } from "@/data/dashboard";

export default function UpcomingDividends() {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161616] p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white">Upcoming Dividends</h2>
        <p className="mt-2 text-sm text-gray-400">
          A focused view of the payouts that matter next.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.16em] text-gray-500">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Payment Date</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {upcomingDividends.map((dividend) => (
              <tr key={`${dividend.company}-${dividend.date}`}>
                <td className="px-4 py-4 font-medium text-white">
                  {dividend.company}
                </td>
                <td className="px-4 py-4 text-gray-400 tabular-nums">
                  {dividend.date}
                </td>
                <td className="px-4 py-4 text-gray-400 tabular-nums">
                  {dividend.amount}
                </td>
                <td className="px-4 py-4 text-gray-400">{dividend.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
