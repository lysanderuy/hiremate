import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, type Profile } from "@/db/schema";
import type { UpdateProfileInput } from "@/validators/profile.validator";

// Example service — replace/extend per project.
export const profileService = {
  async getById(id: string): Promise<Profile | undefined> {
    return db.query.profiles.findFirst({
      where: eq(profiles.id, id),
    });
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
