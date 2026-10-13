import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { HttpError } from "@/lib/api/errors";
import { applications, resumeFiles, resumes, type Resume } from "@/db/schema";
import { skillService } from "@/services/skill.service";
import type { ResumeSource } from "@/types/resumes";
import type { ResumeResponse } from "@/validators/resume.validator";

function toResponse(row: Resume): ResumeResponse {
  return {
    id: row.id,
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

  async getMyFile(userId: string): Promise<{ data: Buffer; fileName: string }> {
    const [row] = await db
      .select({ data: resumeFiles.data, fileName: resumeFiles.fileName })
      .from(resumes)
      .innerJoin(resumeFiles, eq(resumeFiles.id, resumes.fileId))
      .where(eq(resumes.applicantId, userId));
    if (!row) throw new HttpError("No resume file on record.", 404);
    return row;
  },

  async saveMine(
    userId: string,
    {
      text,
      source,
      file,
      fileName,
    }: { text: string; source: ResumeSource; file: Uint8Array; fileName: string },
  ): Promise<ResumeResponse> {
    let skills: string[];
    try {
      skills = await skillService.extractFromText(text);
    } catch (error) {
      console.error("[resume] skill extraction failed", error);
      throw new HttpError("We could not process your resume. Please try again.", 503);
    }

    const row = await db.transaction(async (tx) => {
      const [current] = await tx
        .select({ fileId: resumes.fileId })
        .from(resumes)
        .where(eq(resumes.applicantId, userId));

      const [stored] = await tx
        .insert(resumeFiles)
        .values({
          ownerId: userId,
          fileName,
          data: Buffer.from(file),
          byteSize: file.byteLength,
        })
        .returning({ id: resumeFiles.id });

      const values = {
        text,
        source,
        fileId: stored.id,
        state: "ready" as const,
        skills,
        updatedAt: new Date(),
      };
      const [saved] = await tx
        .insert(resumes)
        .values({ applicantId: userId, ...values })
        .onConflictDoUpdate({ target: resumes.applicantId, set: values })
        .returning();

      if (current?.fileId) {
        await tx
          .delete(resumeFiles)
          .where(
            and(
              eq(resumeFiles.id, current.fileId),
              sql`not exists (select 1 from ${applications} where ${applications.resumeFileId} = ${resumeFiles.id})`,
            ),
          );
      }

      return saved;
    });

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
