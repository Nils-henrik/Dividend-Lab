-- Trigger helper functions are invoked by database triggers only.
-- They must not be directly callable through exposed RPC roles.
revoke all on function public.notify_on_contact_request() from public;
revoke all on function public.notify_on_forum_reply() from public;
