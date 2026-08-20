alter function public.apply_moderation_decision(
  uuid, uuid, text, text, text, text, text, text, boolean, text, timestamptz
) security definer;

revoke select on table public.profile_staff_roles from service_role;
