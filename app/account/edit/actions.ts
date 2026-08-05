"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import { getProfileForUser, updateProfileForUser } from "@/lib/profiles/profile";
import type { ProfileFormValues } from "@/lib/profiles/types";
import { createClient } from "@/lib/supabase/server";

type ProfileFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

const AVATAR_BUCKET = "avatars";
const MAX_OPTIMIZED_AVATAR_SIZE_BYTES = 1024 * 1024;
const AVATAR_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function getFormValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function parseAvatarDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,(.+)$/);

  if (!match) {
    return {
      data: null,
      mimeType: null,
      error: "Använd verktyget för profilbild innan du sparar bilden.",
    };
  }

  const [, mimeType, base64Data] = match;
  const data = Buffer.from(base64Data, "base64");

  if (data.byteLength > MAX_OPTIMIZED_AVATAR_SIZE_BYTES) {
    return {
      data: null,
      mimeType: null,
      error: "Den beskurna profilbilden får vara högst 1 MB.",
    };
  }

  return {
    data,
    mimeType,
    error: null,
  };
}

async function uploadAvatar(userId: string, avatarDataUrl: string) {
  const parsedAvatar = parseAvatarDataUrl(avatarDataUrl);

  if (parsedAvatar.error || !parsedAvatar.data || !parsedAvatar.mimeType) {
    return {
      avatarPath: null,
      error: parsedAvatar.error,
    };
  }

  const extension = AVATAR_EXTENSIONS[parsedAvatar.mimeType];

  if (!extension) {
    return {
      avatarPath: null,
      error: "Ladda upp en JPEG-, PNG- eller WebP-bild.",
    };
  }

  const avatarPath = `${userId}/avatar.${extension}`;
  const supabase = await createClient();
  const existingProfile = await getProfileForUser(userId);
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(avatarPath, parsedAvatar.data, {
      cacheControl: "3600",
      contentType: parsedAvatar.mimeType,
      upsert: true,
    });

  if (error) {
    return {
      avatarPath: null,
      error: error.message,
    };
  }

  if (existingProfile?.avatarPath && existingProfile.avatarPath !== avatarPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([existingProfile.avatarPath]);
  }

  return {
    avatarPath,
    error: null,
  };
}

export async function saveProfileAction(
  _state: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireAuthenticatedUser();
  const values: ProfileFormValues = {
    username: getFormValue(formData, "username"),
    displayName: getFormValue(formData, "displayName"),
    bio: getFormValue(formData, "bio"),
    favoriteSector: getFormValue(formData, "favoriteSector"),
    investorGoal: getFormValue(formData, "investorGoal"),
  };
  const avatarDataUrl = getFormValue(formData, "avatarDataUrl");
  let avatarPath: string | undefined;

  if (avatarDataUrl) {
    const uploadResult = await uploadAvatar(user.id, avatarDataUrl);

    if (uploadResult.error) {
      return {
        status: "error",
        message: uploadResult.error,
      };
    }

    avatarPath = uploadResult.avatarPath ?? undefined;
  }

  const result = await updateProfileForUser(user.id, {
    ...values,
    avatarPath,
  });

  if (result.error) {
    return {
      status: "error",
      message: result.error,
    };
  }

  revalidatePath("/account");
  revalidatePath("/account/edit");
  revalidatePath("/dashboard/account");

  redirect("/account");
}
