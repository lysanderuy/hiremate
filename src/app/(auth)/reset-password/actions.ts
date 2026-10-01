"use server";

import { cookies } from "next/headers";

import { RECOVERY_COOKIE, RESET_PASSWORD_PATH } from "@/lib/auth/recovery";

export async function completeRecovery() {
  (await cookies()).delete({ name: RECOVERY_COOKIE, path: RESET_PASSWORD_PATH });
}
