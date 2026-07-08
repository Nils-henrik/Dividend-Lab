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
      className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#161616] text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
    >
      <AppIcon name="bell" />
      {hasUnreadMessages && (
        <span className="absolute right-2 top-2 flex min-h-4 min-w-4 items-center justify-center rounded-full border border-[#090909] bg-[#D4AF37] px-1 text-[10px] font-semibold leading-none text-black">
          {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
        </span>
      )}
    </button>
  );
}
