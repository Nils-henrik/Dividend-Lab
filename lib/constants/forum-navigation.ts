export type ForumNavItem = {
  label: string;
  href: string;
  /** Prefix match for nested routes (e.g. /forum/kategorier/stocks). */
  matchPrefix?: boolean;
};

export const forumNavigationItems: ForumNavItem[] = [
  { label: "Översikt", href: "/forum" },
  { label: "Senaste", href: "/forum/senaste" },
  { label: "Populärt", href: "/forum/populart" },
  {
    label: "Kategorier",
    href: "/forum/kategorier",
    matchPrefix: true,
  },
  { label: "Bolag", href: "/forum/bolag" },
];

export function isForumNavItemActive(pathname: string, item: ForumNavItem) {
  if (item.href === "/forum") {
    return pathname === "/forum";
  }

  if (item.matchPrefix) {
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  }

  return pathname === item.href;
}
