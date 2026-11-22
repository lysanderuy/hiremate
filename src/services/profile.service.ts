import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import { retryDatabaseRead } from "@/lib/database/retry";
import type { ProfileResponse, UpdateProfileInput } from "@/validators/profile.validator";

export function toProfileResponse(profile: Profile): ProfileResponse {
  return {
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName,
    jobTitle: profile.jobTitle,
    role: profile.role,
    accountStatus: profile.accountStatus,
    rejectionReason: profile.rejectionReason,
    approvedAt: profile.approvedAt?.toISOString() ?? null,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

// Example service — replace/extend per project.
export const profileService = {
  async getById(id: string): Promise<Profile | undefined> {
    return retryDatabaseRead(() =>
      db.query.profiles.findFirst({
        where: eq(profiles.id, id),
      }),
    );
  },

  async update(id: string, input: UpdateProfileInput): Promise<Profile | undefined> {
    const [updated] = await db
      .update(profiles)
      .set({ ...input, updatedAt: new Date() })
      .where(eq(profiles.id, id))
      .returning();

    return updated;
  },
};
