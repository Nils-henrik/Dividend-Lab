import AppIcon from "./AppIcon";

export default function NotificationBell() {
  return (
    <button
      type="button"
      aria-label="Notifications"
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-[#161616] text-gray-400 transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
    >
      <AppIcon name="bell" />
    </button>
  );
}
