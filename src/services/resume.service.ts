import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { HttpError } from "@/lib/api/errors";
import { resumes, type Resume } from "@/db/schema";
import { skillService } from "@/services/skill.service";
import type { ResumeSource } from "@/types/resumes";
import type { ResumeResponse } from "@/validators/resume.validator";

function toResponse(row: Resume): ResumeResponse {
  return {
    id: row.id,
    text: row.text,
    source: row.source,
    state: row.state,
    skills: row.skills,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const resumeService = {
  async getMine(userId: string): Promise<ResumeResponse | null> {
    const [row] = await db.select().from(resumes).where(eq(resumes.applicantId, userId));
    return row ? toResponse(row) : null;
  },

  async saveMine(
    userId: string,
    { text, source }: { text: string; source: ResumeSource },
  ): Promise<ResumeResponse> {
    let skills: string[] = [];
    let state: Resume["state"] = "ready";
    try {
      skills = await skillService.extractFromText(text);
    } catch (error) {
      console.error("[resume] skill extraction failed", error);
      state = "failed";
    }

    const values = { text, source, state, skills, updatedAt: new Date() };
    const [row] = await db
      .insert(resumes)
      .values({ applicantId: userId, ...values })
      .onConflictDoUpdate({ target: resumes.applicantId, set: values })
      .returning();

    return toResponse(row);
  },

  async reprocessMine(userId: string): Promise<ResumeResponse> {
    const [existing] = await db.select().from(resumes).where(eq(resumes.applicantId, userId));
    if (!existing) throw new HttpError("Resume not found", 404);

    let skills: string[] = [];
    let state: Resume["state"] = "ready";
    try {
      skills = await skillService.extractFromText(existing.text);
    } catch (error) {
      console.error("[resume] skill extraction failed", error);
      state = "failed";
    }

    const [row] = await db
      .update(resumes)
      .set({ state, skills, updatedAt: new Date() })
      .where(and(eq(resumes.applicantId, userId), eq(resumes.text, existing.text)))
      .returning();

    if (row) return toResponse(row);

    // The resume was replaced while skills were being extracted; keep the newer one.
    const [current] = await db.select().from(resumes).where(eq(resumes.applicantId, userId));
    return toResponse(current ?? existing);
  },
};
