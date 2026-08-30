create or replace function public.validate_divlab_peer_comparison_audit_integrity_trigger()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_row jsonb;
  v_audit_id uuid;
begin
  v_row := to_jsonb(new);
  v_audit_id := coalesce(
    nullif(v_row ->> 'id', '')::uuid,
    nullif(v_row ->> 'audit_id', '')::uuid
  );

  if v_audit_id is null then
    raise exception 'divlab_peer_comparison_audit_integrity_trigger_missing_audit_id';
  end if;

  perform public.assert_divlab_peer_comparison_audit_integrity(v_audit_id);
  return new;
end;
$$;

revoke all on function public.validate_divlab_peer_comparison_audit_integrity_trigger()
from public, anon, authenticated;
grant execute on function public.validate_divlab_peer_comparison_audit_integrity_trigger()
to service_role;