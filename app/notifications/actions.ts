"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedUser } from "@/lib/auth/session";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications/notifications";
import type { NotificationActionState } from "@/lib/notifications/types";

function revalidateNotificationSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/contacts");
  revalidatePath("/messages");
  revalidatePath("/forum");
  revalidatePath("/dashboard");
}

export async function markNotificationReadAction(
  notificationId: string,
): Promise<NotificationActionState> {
  await requireAuthenticatedUser();

  if (!notificationId || notificationId === "message-summary") {
    return { status: "idle", message: "" };
  }

  try {
    await markNotificationRead(notificationId);
    revalidateNotificationSurfaces();
    return { status: "success", message: "" };
  } catch {
    return {
      status: "error",
      message: "Notifikationen kunde inte markeras som läst.",
    };
  }
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionState> {
  await requireAuthenticatedUser();

  try {
    await markAllNotificationsRead();
    revalidateNotificationSurfaces();
    return { status: "success", message: "" };
  } catch {
    return {
      status: "error",
      message: "Notifikationerna kunde inte markeras som lästa.",
    };
  }
}
