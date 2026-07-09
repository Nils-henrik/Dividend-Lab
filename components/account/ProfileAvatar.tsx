type Props = {
  avatarUrl: string | null;
  initials: string;
  sizeClassName?: string;
  textClassName?: string;
  highlighted?: boolean;
};

export default function ProfileAvatar({
  avatarUrl,
  initials,
  sizeClassName = "h-11 w-11",
  textClassName = "text-sm",
  highlighted = false,
}: Props) {
  const avatarContent = (
    <span
      className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded-full font-semibold text-divlab-text-secondary ${
        highlighted
          ? "divlab-avatar-highlight-ring"
          : "border border-divlab-border-strong bg-gradient-to-br from-divlab-elevated via-divlab-card to-divlab-bg"
      } ${textClassName}`}
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
        initials
      )}
    </span>
  );

  if (!highlighted) {
    return (
      <span className={`relative inline-flex shrink-0 ${sizeClassName}`}>
        {avatarContent}
      </span>
    );
  }

  return (
    <span className={`divlab-avatar-highlight ${sizeClassName}`}>
      {avatarContent}
    </span>
  );
}
