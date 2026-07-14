"use client";

import { type ChangeEvent, useActionState, useEffect, useState } from "react";
import { saveProfileAction } from "@/app/account/edit/actions";
import { PROFILE_LIMITS } from "@/lib/profiles/validation";
import type { ProfileFormValues } from "@/lib/profiles/types";
import AvatarCropModal from "./AvatarCropModal";

type Props = {
  initialValues: ProfileFormValues;
  avatarUrl: string | null;
  initials: string;
};

const initialFormState = {
  status: "idle",
  message: "",
} as const;

const MAX_SOURCE_AVATAR_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProfileEditForm({
  initialValues,
  avatarUrl,
  initials,
}: Props) {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [avatarDataUrl, setAvatarDataUrl] = useState("");
  const [avatarError, setAvatarError] = useState("");
  const [state, formAction, isPending] = useActionState(
    saveProfileAction,
    initialFormState,
  );

  useEffect(() => {
    return () => {
      if (selectedImageUrl) {
        URL.revokeObjectURL(selectedImageUrl);
      }

      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl, selectedImageUrl]);

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
    }

    setAvatarError("");

    if (!file) {
      setSelectedImageUrl(null);
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Filformatet stöds inte. Ladda upp JPG, PNG eller WebP.");
      event.target.value = "";
      setSelectedImageUrl(null);
      return;
    }

    if (file.size > MAX_SOURCE_AVATAR_SIZE_BYTES) {
      setAvatarError("Välj en bild under 10 MB.");
      event.target.value = "";
      setSelectedImageUrl(null);
      return;
    }

    setSelectedImageUrl(URL.createObjectURL(file));
    event.target.value = "";
  }

  function handleCropCancel() {
    if (selectedImageUrl) {
      URL.revokeObjectURL(selectedImageUrl);
    }

    setSelectedImageUrl(null);
  }

  function handleCropConfirm(dataUrl: string) {
    setAvatarDataUrl(dataUrl);
    setAvatarPreviewUrl(dataUrl);
    handleCropCancel();
  }

  return (
    <div className="space-y-8">
      <section className="divlab-hero">
        <p className="mb-3 divlab-section-label tracking-[0.25em]">
          Investeraridentitet
        </p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-divlab-text">
          Redigera profil
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-divlab-text-secondary">
          Hantera de offentliga profilfält som DivLab använder för din
          community-identitet.
        </p>
      </section>

      <section className="divlab-card rounded-3xl p-8">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="avatarDataUrl" value={avatarDataUrl} />
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-divlab-blue/35 bg-gradient-to-br from-divlab-blue/20 via-white/[0.04] to-[#050505] text-2xl font-semibold text-divlab-blue-muted">
                {avatarPreviewUrl || avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreviewUrl ?? avatarUrl ?? undefined}
                    alt="Förhandsvisning av profilbild"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <label className="block flex-1">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                  Profilbild
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="divlab-input w-full px-4 py-3 text-sm text-gray-300 file:mr-4 file:rounded-lg file:border-0 file:bg-divlab-blue file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
                />
                <span className="mt-2 block text-xs leading-5 text-gray-600">
                  JPEG, PNG eller WebP upp till 10 MB. Du placerar och beskär
                  bilden innan du sparar.
                </span>
                {avatarError && (
                  <span className="mt-2 block text-xs leading-5 text-gray-300">
                    {avatarError}
                  </span>
                )}
              </label>
            </div>
          </section>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Visningsnamn
              </span>
              <input
                name="displayName"
                type="text"
                defaultValue={initialValues.displayName}
                maxLength={PROFILE_LIMITS.displayNameMax}
                className="divlab-input w-full px-4 py-3 text-white"
              />
              <span className="mt-2 block text-xs text-gray-600">
                Upp till {PROFILE_LIMITS.displayNameMax} tecken.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Användarnamn
              </span>
              <input
                name="username"
                type="text"
                defaultValue={initialValues.username}
                minLength={PROFILE_LIMITS.usernameMin}
                maxLength={PROFILE_LIMITS.usernameMax}
                pattern="[A-Za-z0-9_]{3,20}"
                className="divlab-input w-full px-4 py-3 text-white"
              />
              <span className="mt-2 block text-xs text-gray-600">
                Offentliga användarnamn sparas med gemener. Använd{" "}
                {PROFILE_LIMITS.usernameMin} till {PROFILE_LIMITS.usernameMax}{" "}
                bokstäver, siffror eller understreck.
              </span>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
              Bio
            </span>
            <textarea
              name="bio"
              defaultValue={initialValues.bio}
              maxLength={PROFILE_LIMITS.bioMax}
              rows={5}
              className="divlab-input w-full resize-none px-4 py-3 text-white"
            />
            <span className="mt-2 block text-xs text-gray-600">
              Upp till {PROFILE_LIMITS.bioMax} tecken.
            </span>
          </label>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Favoritsektor
              </span>
              <input
                name="favoriteSector"
                type="text"
                defaultValue={initialValues.favoriteSector}
                maxLength={PROFILE_LIMITS.favoriteSectorMax}
                className="divlab-input w-full px-4 py-3 text-white"
              />
              <span className="mt-2 block text-xs text-gray-600">
                Upp till {PROFILE_LIMITS.favoriteSectorMax} tecken.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Investeringsmål
              </span>
              <input
                name="investorGoal"
                type="text"
                defaultValue={initialValues.investorGoal}
                maxLength={PROFILE_LIMITS.investorGoalMax}
                className="divlab-input w-full px-4 py-3 text-white"
              />
              <span className="mt-2 block text-xs text-gray-600">
                Upp till {PROFILE_LIMITS.investorGoalMax} tecken.
              </span>
            </label>
          </div>

          {state.message && (
            <p
              className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                state.status === "success"
                  ? "border-divlab-blue/20 bg-divlab-blue/5 text-gray-300"
                  : "border-white/10 bg-white/[0.03] text-gray-300"
              }`}
            >
              {state.message}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="divlab-btn-primary px-8 py-3 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Sparar..." : "Spara profil"}
            </button>
          </div>
        </form>
      </section>

      {selectedImageUrl && (
        <AvatarCropModal
          imageUrl={selectedImageUrl}
          onCancel={handleCropCancel}
          onConfirm={handleCropConfirm}
        />
      )}
    </div>
  );
}
