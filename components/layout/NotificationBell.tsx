import AppIcon from "./AppIcon";

type Props = {
  unreadMessageCount: number;
};

export default function NotificationBell({ unreadMessageCount }: Props) {
  const hasUnreadMessages = unreadMessageCount > 0;

  return (
    <button
      type="button"
      aria-label={
        hasUnreadMessages
          ? `${unreadMessageCount} olästa meddelanden`
          : "Inga olästa meddelanden"
      }
      className="relative flex h-11 w-11 items-center justify-center divlab-input text-divlab-text-muted hover:border-divlab-blue/40 hover:text-divlab-blue"
    >
      <AppIcon name="bell" />
      {hasUnreadMessages && (
        <span className="absolute right-2 top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full border border-divlab-bg bg-divlab-blue px-1 text-[10px] font-semibold leading-none text-white">
          {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
        </span>
      )}
    </button>
  );
}
