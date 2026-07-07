import type { ProfileFormValues, ProfileUpdateInput } from "./types";

export const PROFILE_LIMITS = {
  usernameMin: 3,
  usernameMax: 20,
  displayNameMax: 40,
  bioMax: 240,
  favoriteSectorMax: 40,
  investorGoalMax: 120,
};

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

function normalizeOptionalValue(value: string | null | undefined) {
  const normalizedValue = value?.trim() ?? "";

  return normalizedValue === "" ? null : normalizedValue;
}

export function validateProfileValues(values: ProfileFormValues) {
  const errors: string[] = [];
  const username = normalizeOptionalValue(values.username)?.toLowerCase() ?? null;
  const displayName = normalizeOptionalValue(values.displayName);
  const bio = normalizeOptionalValue(values.bio);
  const favoriteSector = normalizeOptionalValue(values.favoriteSector);
  const investorGoal = normalizeOptionalValue(values.investorGoal);

  if (username && !USERNAME_PATTERN.test(username)) {
    errors.push(
      "Username must be 3-20 characters and use only letters, numbers or underscores.",
    );
  }

  if (displayName && displayName.length > PROFILE_LIMITS.displayNameMax) {
    errors.push("Display name must be 40 characters or less.");
  }

  if (bio && bio.length > PROFILE_LIMITS.bioMax) {
    errors.push("Bio must be 240 characters or less.");
  }

  if (
    favoriteSector &&
    favoriteSector.length > PROFILE_LIMITS.favoriteSectorMax
  ) {
    errors.push("Favorite sector must be 40 characters or less.");
  }

  if (investorGoal && investorGoal.length > PROFILE_LIMITS.investorGoalMax) {
    errors.push("Investor goal must be 120 characters or less.");
  }

  return {
    errors,
    values: {
      username,
      displayName,
      bio,
      favoriteSector,
      investorGoal,
    } satisfies ProfileUpdateInput,
  };
}
