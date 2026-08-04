-- DivBrain: explicit service_role table privileges for the trusted server repository.
--
-- Production diagnostic: conversation_list_permission_denied (PostgreSQL 42501).
-- Ticket 1A-6 created authenticated RLS/grants but did not grant service_role.
--
-- Least privilege for the existing repository surface:
--   conversations: SELECT, INSERT, UPDATE, DELETE
--   messages: SELECT, INSERT only (no UPDATE/DELETE)
--
-- Does not alter RLS, policies, ownership, role attributes, or default privileges.
-- Does not grant to anon or authenticated.
-- Uses explicit privilege lists only (no blanket all-privileges grant).

grant select, insert, update, delete
on table public.divbrain_conversations
to service_role;

grant select, insert
on table public.divbrain_messages
to service_role;
