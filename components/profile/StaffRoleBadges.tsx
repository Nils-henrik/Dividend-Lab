import {
  getStaffRoleBadgeClassName,
  getStaffRoleLabel,
  type StaffRole,
} from "@/lib/profiles/staff-roles";

type Props = {
  roles: StaffRole[];
  className?: string;
};

export default function StaffRoleBadges({ roles, className = "" }: Props) {
  if (roles.length === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-2 ${className}`.trim()}
      aria-label="Staffroller"
    >
      {roles.map((role) => (
        <span
          key={role}
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-[0.02em] ${getStaffRoleBadgeClassName(role)}`}
        >
          {getStaffRoleLabel(role)}
        </span>
      ))}
    </div>
  );
}
