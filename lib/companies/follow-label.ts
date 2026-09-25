export type FollowButtonMode = "page" | "unfollow" | "discovery";

export function followButtonLabel(
  isFollowing: boolean,
  mode: FollowButtonMode,
  pending = false,
) {
  if (pending) {
    return "Sparar…";
  }

  if (mode === "unfollow") {
    return "Sluta följ";
  }

  if (mode === "discovery") {
    return isFollowing ? "Följer ✓" : "+ Följ";
  }

  return isFollowing ? "Följer ✓" : "+ Följ bolaget";
}

export function followButtonAriaLabel(companyName: string, isFollowing: boolean) {
  return isFollowing ? `Sluta följa ${companyName}` : `Följ ${companyName}`;
}
