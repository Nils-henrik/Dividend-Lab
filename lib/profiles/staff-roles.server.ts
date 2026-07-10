import { createClient } from "@/lib/supabase/server";
import {
  getRenderableStaffRoles,
  type StaffRole,
} from "@/lib/profiles/staff-roles";

type StaffRoleRow = {
  role: string;
};

export async function getStaffRolesForUser(userId: string): Promise<StaffRole[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profile_staff_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return getRenderableStaffRoles((data ?? []).map((row: StaffRoleRow) => row.role));
}
