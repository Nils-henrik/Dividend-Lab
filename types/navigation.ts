import type { AppIconName } from "@/components/layout/AppIcon";

export type NavigationVisibility = "all" | "mobile-only";

export type NavigationSection = "main" | "account";

export type NavigationItem = {
  label: string;
  href: string;
  icon: AppIconName;
  visibility?: NavigationVisibility;
  statusLabel?: string;
  section?: NavigationSection;
};
