import type { AccountIconName } from "@/data/account";

type Props = {
  name: AccountIconName;
  className?: string;
};

const icons: Record<AccountIconName, string> = {
  award:
    "M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-3 3-1 3 4-2 4 2-1-3M9 9.5l2 2 4-4",
  briefcase: "M4 8h16v11H4V8Zm4 0V5h8v3M4 13h16",
  camera:
    "M4 8h3l1.5-2h7L17 8h3v10H4V8Zm8 8a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  cashflow:
    "M5 7h14M5 12h14M5 17h14M8 5v14M16 5v14M11 9.5h2a2 2 0 0 1 0 4h-2",
  chart: "M4 19V5M4 19h16M8 15l3-4 3 2 4-6",
  compass:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z",
  flag: "M6 20V5m0 0h10l-1.5 4L16 13H6",
  globe:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.3-2.3 3.5-5.3 3.5-9S14.3 5.3 12 3m0 18c-2.3-2.3-3.5-5.3-3.5-9S9.7 5.3 12 3M3.5 12h17",
  quote: "M8 8H5v6h4V8Zm11 0h-3v6h4V8Z",
  shield: "M12 21s7-3.5 7-10V5l-7-2-7 2v6c0 6.5 7 10 7 10Z",
  target:
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-2a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  timer:
    "M12 21a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm0-10v4l3 1.5M9 3h6M12 3v4",
};

export default function AccountIcon({
  name,
  className = "h-4 w-4",
}: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={icons[name]} />
    </svg>
  );
}
