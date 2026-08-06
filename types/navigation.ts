import type { AppIconName } from "@/components/layout/AppIcon";

export type NavigationVisibility = "all" | "mobile-only";

export type NavigationSection = "main" | "account";

export type NavigationChildItem = {
  label: string;
  href: string;
};

export type NavigationItem = {
  label: string;
  /** Present for direct links; omit for expandable disclosure groups. */
  href?: string;
  icon: AppIconName;
  children?: NavigationChildItem[];
  visibility?: NavigationVisibility;
  statusLabel?: string;
  section?: NavigationSection;
};
