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
      setAvatarError("Unsupported image type. Please upload JPG, PNG or WebP.");
      event.target.value = "";
      setSelectedImageUrl(null);
      return;
    }

    if (file.size > MAX_SOURCE_AVATAR_SIZE_BYTES) {
      setAvatarError("Choose an image under 10 MB.");
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
      <section className="rounded-3xl border border-white/10 bg-[#111111]/85 p-6 shadow-[0_0_80px_rgba(212,175,55,0.06)]">
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.25em] text-[#D4AF37]">
          Investor Identity
        </p>
        <h2 className="text-4xl font-semibold tracking-[-0.04em] text-white">
          Edit Profile
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-gray-400">
          Manage the public profile fields Dividend Lab will use for community
          identity.
        </p>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#161616] p-8 shadow-[0_0_80px_rgba(212,175,55,0.05)]">
        <form action={formAction} className="space-y-6">
          <input type="hidden" name="avatarDataUrl" value={avatarDataUrl} />
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#D4AF37]/35 bg-gradient-to-br from-[#D4AF37]/20 via-white/[0.04] to-[#050505] text-2xl font-semibold text-[#F9D976]">
                {avatarPreviewUrl || avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarPreviewUrl ?? avatarUrl ?? undefined}
                    alt="Profile avatar preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>
              <label className="block flex-1">
                <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                  Profile Image
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-sm text-gray-300 outline-none transition file:mr-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black focus:border-[#D4AF37]/70"
                />
                <span className="mt-2 block text-xs leading-5 text-gray-600">
                  JPEG, PNG or WebP up to 10 MB. You will position and crop the
                  image before saving.
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
                Display Name
              </span>
              <input
                name="displayName"
                type="text"
                defaultValue={initialValues.displayName}
                maxLength={PROFILE_LIMITS.displayNameMax}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
              />
              <span className="mt-2 block text-xs text-gray-600">
                Up to {PROFILE_LIMITS.displayNameMax} characters.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Username
              </span>
              <input
                name="username"
                type="text"
                defaultValue={initialValues.username}
                minLength={PROFILE_LIMITS.usernameMin}
                maxLength={PROFILE_LIMITS.usernameMax}
                pattern="[A-Za-z0-9_]{3,20}"
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
              />
              <span className="mt-2 block text-xs text-gray-600">
                Public handles are saved in lowercase. Use 3 to{" "}
                {PROFILE_LIMITS.usernameMax} letters, numbers or underscores.
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
              className="w-full resize-none rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
            />
            <span className="mt-2 block text-xs text-gray-600">
              Up to {PROFILE_LIMITS.bioMax} characters.
            </span>
          </label>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Favorite Sector
              </span>
              <input
                name="favoriteSector"
                type="text"
                defaultValue={initialValues.favoriteSector}
                maxLength={PROFILE_LIMITS.favoriteSectorMax}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
              />
              <span className="mt-2 block text-xs text-gray-600">
                Up to {PROFILE_LIMITS.favoriteSectorMax} characters.
              </span>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-gray-500">
                Investor Goal
              </span>
              <input
                name="investorGoal"
                type="text"
                defaultValue={initialValues.investorGoal}
                maxLength={PROFILE_LIMITS.investorGoalMax}
                className="w-full rounded-xl border border-white/10 bg-[#111111] px-4 py-3 text-white outline-none transition focus:border-[#D4AF37]/70"
              />
              <span className="mt-2 block text-xs text-gray-600">
                Up to {PROFILE_LIMITS.investorGoalMax} characters.
              </span>
            </label>
          </div>

          {state.message && (
            <p
              className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                state.status === "success"
                  ? "border-[#D4AF37]/20 bg-[#D4AF37]/5 text-gray-300"
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
              className="rounded-xl border border-[#D4AF37] bg-[#D4AF37] px-8 py-3 text-sm font-semibold text-black shadow-[0_0_30px_rgba(212,175,55,0.16)] transition-all duration-300 hover:bg-[#F9D976] hover:shadow-[0_0_34px_rgba(212,175,55,0.22)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "Saving..." : "Save Profile"}
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
