export const forumDiscussions = [
  {
    title: "Hur bedömer ni hållbarheten i en utdelning?",
    replies: "18",
    activity: "12 min sedan",
  },
  {
    title: "Månadsinkomst och milstolpar för 2026",
    replies: "9",
    activity: "42 min sedan",
  },
  {
    title: "Balans mellan avkastning och tillväxt i Sverige",
    replies: "24",
    activity: "2 h sedan",
  },
];

/** @deprecated Used only by legacy dashboard components not shown on DivLab Start. */
export const overviewStats = [
  { title: "Portfolio Value", value: "—", change: "—" },
  { title: "Annual Dividends", value: "—", change: "—" },
  { title: "Dividend Yield", value: "—", change: "—" },
  { title: "Monthly Income", value: "—", change: "—" },
];

/** @deprecated Used only by legacy dashboard components not shown on DivLab Start. */
export const upcomingDividends: Array<{
  company: string;
  date: string;
  amount: string;
  status: string;
}> = [];

/** @deprecated Used only by legacy dashboard components not shown on DivLab Start. */
export const annualDividendGoal = {
  progress: "—",
  current: "—",
  target: "—",
  message: "",
};
