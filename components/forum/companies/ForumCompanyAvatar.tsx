import ProfileAvatar from "@/components/account/ProfileAvatar";
import { getForumCompanyInitials } from "@/lib/forum/companies/filters";

type Props = {
  name: string;
  logoPath?: string | null;
  sizeClassName?: string;
};

export default function ForumCompanyAvatar({
  name,
  logoPath = null,
  sizeClassName = "h-10 w-10",
}: Props) {
  return (
    <ProfileAvatar
      avatarUrl={logoPath}
      initials={getForumCompanyInitials(name)}
      sizeClassName={sizeClassName}
      textClassName="text-xs"
      imageAlt=""
    />
  );
}
