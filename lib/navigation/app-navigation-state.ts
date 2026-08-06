import type { NavigationChildItem, NavigationItem } from "@/types/navigation";

export function isNavPathActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavigationChildActive(
  pathname: string,
  child: NavigationChildItem,
) {
  return isNavPathActive(pathname, child.href);
}

export function isNavigationItemActive(
  pathname: string,
  item: NavigationItem,
) {
  if (item.children && item.children.length > 0) {
    return item.children.some((child) =>
      isNavigationChildActive(pathname, child),
    );
  }

  if (!item.href) {
    return false;
  }

  return isNavPathActive(pathname, item.href);
}

/** Expand when the current route belongs to a child tool (or nested path). */
export function shouldNavigationGroupStartExpanded(
  pathname: string,
  item: NavigationItem,
) {
  return Boolean(
    item.children?.some((child) => isNavigationChildActive(pathname, child)),
  );
}

export function getNavigationItemKey(item: NavigationItem) {
  return item.href ?? `group:${item.label}`;
}
