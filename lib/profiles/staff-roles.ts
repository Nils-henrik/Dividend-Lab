export const STAFF_ROLE_VALUES = [
  "ceo_divlab",
  "founder",
  "moderator",
  "admin",
  "support",
  "verified",
] as const;

export type StaffRole = (typeof STAFF_ROLE_VALUES)[number];

const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  ceo_divlab: "CEO DivLab",
  founder: "Founder",
  moderator: "Moderator",
  admin: "Admin",
  support: "Support",
  verified: "Verified",
};

const STAFF_ROLE_DISPLAY_ORDER: StaffRole[] = [
  "ceo_divlab",
  "founder",
  "moderator",
  "admin",
  "support",
  "verified",
];

const STAFF_ROLE_BADGE_CLASS_NAMES: Record<StaffRole, string> = {
  ceo_divlab:
    "border-divlab-blue/35 bg-divlab-blue/10 text-divlab-blue-muted",
  founder: "border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]",
  moderator: "border-slate-400/30 bg-slate-400/10 text-slate-300",
  admin: "border-divlab-blue/25 bg-divlab-blue/10 text-divlab-blue-muted",
  support: "border-slate-400/25 bg-slate-400/10 text-slate-300",
  verified: "border-divlab-border-neutral divlab-inset text-divlab-text-secondary",
};

export function isStaffRole(value: string): value is StaffRole {
  return STAFF_ROLE_VALUES.includes(value as StaffRole);
}

export function getStaffRoleLabel(role: StaffRole) {
  return STAFF_ROLE_LABELS[role];
}

export function getStaffRoleBadgeClassName(role: StaffRole) {
  return STAFF_ROLE_BADGE_CLASS_NAMES[role];
}

export function sortStaffRoles(roles: StaffRole[]) {
  const uniqueRoles = [...new Set(roles)];

  return uniqueRoles.sort(
    (left, right) =>
      STAFF_ROLE_DISPLAY_ORDER.indexOf(left) -
      STAFF_ROLE_DISPLAY_ORDER.indexOf(right),
  );
}

export function getRenderableStaffRoles(values: string[]) {
  return sortStaffRoles(values.filter(isStaffRole));
}
