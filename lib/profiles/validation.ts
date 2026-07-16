import type { ProfileFormValues, ProfileUpdateInput } from "./types";
import { normalizeUsername } from "./username";

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
  const username = normalizeUsername(values.username ?? "");
  const displayName = normalizeOptionalValue(values.displayName);
  const bio = normalizeOptionalValue(values.bio);
  const favoriteSector = normalizeOptionalValue(values.favoriteSector);
  const investorGoal = normalizeOptionalValue(values.investorGoal);

  if (username && !USERNAME_PATTERN.test(username)) {
    errors.push(
      "Användarnamnet måste vara 3–20 tecken och får bara innehålla bokstäver, siffror eller understreck.",
    );
  }

  if (displayName && displayName.length > PROFILE_LIMITS.displayNameMax) {
    errors.push("Visningsnamnet får vara högst 40 tecken.");
  }

  if (bio && bio.length > PROFILE_LIMITS.bioMax) {
    errors.push("Bio får vara högst 240 tecken.");
  }

  if (
    favoriteSector &&
    favoriteSector.length > PROFILE_LIMITS.favoriteSectorMax
  ) {
    errors.push("Favoritsektorn får vara högst 40 tecken.");
  }

  if (investorGoal && investorGoal.length > PROFILE_LIMITS.investorGoalMax) {
    errors.push("Investeringsmålet får vara högst 120 tecken.");
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
