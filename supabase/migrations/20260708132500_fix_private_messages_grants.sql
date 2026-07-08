grant select on public.conversations to authenticated;
grant select on public.conversation_participants to authenticated;
grant select, insert on public.messages to authenticated;

revoke update on public.conversation_participants from anon, authenticated;
grant update (last_read_at) on public.conversation_participants to authenticated;

revoke all on function public.get_or_create_private_conversation(uuid, text) from public;
grant execute on function public.get_or_create_private_conversation(uuid, text) to authenticated;

revoke all on function public.is_conversation_participant(uuid, uuid) from public;
grant execute on function public.is_conversation_participant(uuid, uuid) to authenticated;
