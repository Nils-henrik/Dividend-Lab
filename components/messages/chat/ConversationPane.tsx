"use client";

import ProfileAvatar from "@/components/account/ProfileAvatar";
import { DIVLAB_MEMBER_LABEL } from "@/lib/site/brand";
import type { ConversationThread, PresenceView } from "@/lib/messages/types";
import ChatComposer from "./ChatComposer";
import ChatRequestBar from "./ChatRequestBar";
import ChatTranscript from "./ChatTranscript";
import PresenceIndicator from "./PresenceIndicator";

type Props = {
  conversation: ConversationThread;
  currentUserId: string;
  presence?: PresenceView | null;
  compact?: boolean;
  hideHeader?: boolean;
  pending?: boolean;
  sendError?: string | null;
  requestError?: string | null;
  pendingRequestAction?: "accept" | "ignore" | "decline" | null;
  onSend: (conversationId: string, body: string) => Promise<boolean>;
  onAcceptRequest: (conversationId: string) => void;
  onIgnoreRequest: (conversationId: string) => void;
  onDeclineRequest: (conversationId: string) => void;
};

export default function ConversationPane({
  conversation,
  currentUserId,
  presence,
  compact = false,
  hideHeader = false,
  pending = false,
  sendError,
  requestError,
  pendingRequestAction = null,
  onSend,
  onAcceptRequest,
  onIgnoreRequest,
  onDeclineRequest,
}: Props) {
  const other = conversation.otherParticipant;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {hideHeader ? null : (
        <div className="flex items-center gap-3 border-b divlab-border-neutral px-3 py-2.5">
          <ProfileAvatar
            avatarUrl={other?.avatarUrl ?? null}
            initials={other?.initials ?? "DL"}
            sizeClassName={compact ? "h-8 w-8" : "h-10 w-10"}
            textClassName="text-[10px]"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-divlab-text">
              {other?.name ?? DIVLAB_MEMBER_LABEL}
            </p>
            <PresenceIndicator presence={presence} showLabel size="sm" />
          </div>
        </div>
      )}

      <ChatTranscript
        messages={conversation.messages}
        currentUserId={currentUserId}
        otherParticipant={other}
        compact={compact}
      />

      <div className="border-t divlab-border-neutral bg-divlab-surface px-3 py-3">
        {conversation.isMessageRequestRecipient ||
        conversation.isPendingRequestSender ? (
          <ChatRequestBar
            conversation={conversation}
            pendingAction={pendingRequestAction}
            errorMessage={requestError}
            onAccept={onAcceptRequest}
            onIgnore={onIgnoreRequest}
            onDecline={onDeclineRequest}
          />
        ) : conversation.canSend ? (
          <ChatComposer
            conversationId={conversation.id}
            pending={pending}
            errorMessage={sendError}
            compact={compact}
            onSend={onSend}
          />
        ) : (
          <p className="text-sm leading-6 text-divlab-text-muted">
            Du kan inte skicka meddelanden i den här konversationen just nu.
          </p>
        )}
      </div>
    </div>
  );
}