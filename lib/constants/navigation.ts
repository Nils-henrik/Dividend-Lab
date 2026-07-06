import type { NavigationItem } from "@/types/navigation";

export const appNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "Portfolio", href: "/portfolio", icon: "portfolio" },
  { label: "Dividend Brain", href: "/brain", icon: "brain" },
  { label: "Watchlist", href: "/watchlist", icon: "watchlist" },
  { label: "Forum", href: "/forum", icon: "forum" },
  { label: "Learning", href: "/learning", icon: "learning" },
  { label: "Goals", href: "/goals", icon: "goals" },
  { label: "Calendar", href: "/calendar", icon: "calendar" },
  { label: "Account", href: "/account", icon: "account" },
  { label: "Settings", href: "/settings", icon: "settings" },
];

export const pageTitles: Record<string, string> = {
  "/account": "Investor Identity",
  "/account/edit": "Edit Profile",
  "/brain": "Dividend Brain",
  "/calendar": "Calendar",
  "/dashboard": "Dashboard",
  "/forum": "Forum",
  "/goals": "Goals",
  "/learning": "Learning",
  "/portfolio": "Portfolio",
  "/settings": "Settings",
  "/watchlist": "Watchlist",
  "/dashboard/account": "Investor Identity",
  "/dashboard/brain": "Dividend Brain",
  "/dashboard/forum": "Forum",
  "/dashboard/goals": "Goals",
  "/dashboard/learning": "Learning",
  "/dashboard/portfolio": "Portfolio",
  "/dashboard/settings": "Settings",
  "/dashboard/watchlist": "Watchlist",
};
