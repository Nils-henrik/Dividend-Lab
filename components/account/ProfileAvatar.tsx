type Props = {
  avatarUrl: string | null;
  initials: string;
  sizeClassName?: string;
  textClassName?: string;
};

export default function ProfileAvatar({
  avatarUrl,
  initials,
  sizeClassName = "h-11 w-11",
  textClassName = "text-sm",
}: Props) {
  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D4AF37]/35 bg-gradient-to-br from-[#D4AF37]/20 via-white/[0.04] to-[#050505] font-semibold text-[#F9D976] shadow-[0_0_34px_rgba(212,175,55,0.1)] ${sizeClassName} ${textClassName}`}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
      ) : (
        <>
          <span className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(249,217,118,0.22),transparent_36%)]" />
          <span className="absolute inset-x-6 top-4 h-px bg-[#F9D976]/25" />
          <span className="relative">{initials}</span>
        </>
      )}
    </span>
  );
}
