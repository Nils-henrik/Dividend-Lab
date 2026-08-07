alter policy "Users can insert their own profile"
on public.profiles
with check ((select auth.uid()) = id);

alter policy "Users can update their own profile"
on public.profiles
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

alter policy "Users can add their own forum reactions"
on public.forum_reactions
with check (
  user_id = (select auth.uid())
  and (
    (
      target_type = 'thread'::text
      and thread_id is not null
      and not exists (
        select 1
        from public.forum_threads
        where forum_threads.id = forum_reactions.thread_id
          and forum_threads.author_id = (select auth.uid())
      )
    )
    or
    (
      target_type = 'reply'::text
      and reply_id is not null
      and not exists (
        select 1
        from public.forum_replies
        where forum_replies.id = forum_reactions.reply_id
          and forum_replies.author_id = (select auth.uid())
      )
    )
  )
);

alter policy "Users can remove their own forum reactions"
on public.forum_reactions
using (user_id = (select auth.uid()));

alter policy "Users can read messages in their conversations"
on public.messages
using (is_conversation_participant(conversation_id, (select auth.uid())));

alter policy "Users can send messages in their conversations"
on public.messages
with check (
  sender_id = (select auth.uid())
  and can_send_private_message(conversation_id, (select auth.uid()))
);

alter policy "Owners can insert their divbrain conversations"
on public.divbrain_conversations
with check (user_id = (select auth.uid()));

alter policy "Owners can select their divbrain conversations"
on public.divbrain_conversations
using (user_id = (select auth.uid()));

alter policy "Owners can update their divbrain conversations"
on public.divbrain_conversations
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

alter policy "Owners can delete their divbrain conversations"
on public.divbrain_conversations
using (user_id = (select auth.uid()));

alter policy "Users can read their conversations"
on public.conversations
using (is_conversation_participant(id, (select auth.uid())));

alter policy "Users can read participants in their conversations"
on public.conversation_participants
using (is_conversation_participant(conversation_id, (select auth.uid())));

alter policy "Users can update their own participant state"
on public.conversation_participants
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

alter policy "Authenticated users can create forum threads"
on public.forum_threads
with check (author_id = (select auth.uid()));

alter policy "Authors can update their own forum threads"
on public.forum_threads
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

alter policy "Authenticated users can create forum replies"
on public.forum_replies
with check (author_id = (select auth.uid()));

alter policy "Authors can update their own forum replies"
on public.forum_replies
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));

alter policy "Users can read their own connections"
on public.user_connections
using (
  requester_id = (select auth.uid())
  or addressee_id = (select auth.uid())
);

alter policy "Authenticated users can create learning comments"
on public.learning_article_comments
with check (user_id = (select auth.uid()));

alter policy "Users can update their own learning comments"
on public.learning_article_comments
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

alter policy "Users can delete their own learning comments"
on public.learning_article_comments
using (user_id = (select auth.uid()));

alter policy "Users can read their own legal acceptances"
on public.user_legal_acceptances
using ((select auth.uid()) = user_id);

alter policy "Owners can select divbrain messages in their conversations"
on public.divbrain_messages
using (
  exists (
    select 1
    from public.divbrain_conversations conversation
    where conversation.id = divbrain_messages.conversation_id
      and conversation.user_id = (select auth.uid())
  )
);

alter policy "Users can read their own notifications"
on public.user_notifications
using (recipient_id = (select auth.uid()));
