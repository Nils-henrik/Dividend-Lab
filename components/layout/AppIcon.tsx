export type AppIconName =
  | "account"
  | "bell"
  | "brain"
  | "calendar"
  | "dashboard"
  | "forum"
  | "goals"
  | "learning"
  | "messages"
  | "news"
  | "portfolio"
  | "search"
  | "settings"
  | "watchlist";

type Props = {
  name: AppIconName;
  className?: string;
};

const icons: Record<AppIconName, string> = {
  account:
    "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7Zm-4 11a2 2 0 0 1-4 0",
  brain:
    "M8 6a3 3 0 0 1 5-2 3 3 0 0 1 5 2 3 3 0 0 1 1 5 3 3 0 0 1-1 5 3 3 0 0 1-5 2 3 3 0 0 1-5-2 3 3 0 0 1-1-5 3 3 0 0 1 1-5Zm4-2v16M8 10h8M8 14h8",
  calendar:
    "M7 3v4M17 3v4M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 7h3M13 12h3M8 16h3",
  dashboard:
    "M4 13h6V4H4v9Zm10 7h6V4h-6v16ZM4 20h6v-5H4v5Z",
  forum:
    "M4 5h16v10H8l-4 4V5Zm5 4h6M9 12h8",
  goals: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0-3a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
  learning:
    "M4 6.5 12 3l8 3.5-8 3.5-8-3.5Zm3 3.5v5c0 1.7 2.2 3 5 3s5-1.3 5-3v-5",
  messages:
    "M4 5h16v11H8l-4 4V5Zm5 4h6M9 12h4",
  news:
    "M6 4h12a1 1 0 0 1 1 1v14H5V5a1 1 0 0 1 1-1ZM8 8h8M8 12h8M8 16h5",
  portfolio:
    "M4 8h16v11H4V8Zm4 0V5h8v3M4 13h16",
  search: "m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v3m0 11v3m8.5-8.5h-3m-11 0h-3m14.6-6.1-2.1 2.1M7.5 16.5l-2.1 2.1m0-12.7 2.1 2.1m9 8.5 2.1 2.1",
  watchlist:
    "M12 3.5 14.7 9l6.1.9-4.4 4.3 1 6.1L12 17.4l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3.5Z",
};

export default function AppIcon({ name, className = "h-4 w-4" }: Props) {
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
