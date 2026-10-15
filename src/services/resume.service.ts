import "server-only";

import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { HttpError } from "@/lib/api/errors";
import { applications, resumeFiles, resumes, type Resume } from "@/db/schema";
import {
  matcherService,
  PREPARE_COOLDOWN_MESSAGE,
  prepareCooldownElapsed,
} from "@/services/matcher.service";
import { skillService } from "@/services/skill.service";
import type { ResumeSource } from "@/types/resumes";
import type { ResumeResponse } from "@/validators/resume.validator";

const responseColumns = {
  id: resumes.id,
  source: resumes.source,
  state: resumes.state,
  skills: resumes.skills,
  updatedAt: resumes.updatedAt,
};

type ResumeSummary = Pick<Resume, keyof typeof responseColumns>;

function toResponse(row: ResumeSummary): ResumeResponse {
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
    const [row] = await db
      .select(responseColumns)
      .from(resumes)
      .where(eq(resumes.applicantId, userId));
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
    let embedding: number[] | null;
    try {
      [skills, embedding] = await Promise.all([
        skillService.extractFromText(text),
        matcherService.tryEmbedOne("resume", text),
      ]);
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
        state: embedding ? ("ready" as const) : ("failed" as const),
        skills,
        embedding,
        prepareAttemptedAt: null,
        updatedAt: new Date(),
      };
      const [saved] = await tx
        .insert(resumes)
        .values({ applicantId: userId, ...values })
        .onConflictDoUpdate({ target: resumes.applicantId, set: values })
        .returning(responseColumns);

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
    const [claimed] = await db
      .update(resumes)
      .set({ prepareAttemptedAt: sql`now()` })
      .where(
        and(eq(resumes.applicantId, userId), prepareCooldownElapsed(resumes.prepareAttemptedAt)),
      )
      .returning({ text: resumes.text });

    if (!claimed) {
      const [existing] = await db
        .select({ id: resumes.id })
        .from(resumes)
        .where(eq(resumes.applicantId, userId));
      if (!existing) throw new HttpError("Resume not found", 404);
      throw new HttpError(PREPARE_COOLDOWN_MESSAGE, 429);
    }

    let skills: string[] = [];
    let skillsOk = true;
    const [, embedding] = await Promise.all([
      skillService.extractFromText(claimed.text).then(
        (extracted) => {
          skills = extracted;
        },
        (error: unknown) => {
          console.error("[resume] skill extraction failed", error);
          skillsOk = false;
        },
      ),
      matcherService.tryEmbedOne("resume", claimed.text),
    ]);
    const state: Resume["state"] = skillsOk && embedding ? "ready" : "failed";

    const [row] = await db
      .update(resumes)
      .set({ state, skills, embedding, updatedAt: new Date() })
      .where(and(eq(resumes.applicantId, userId), eq(resumes.text, claimed.text)))
      .returning(responseColumns);

    if (row) return toResponse(row);

    // The resume was replaced while it was being processed; keep the newer one.
    const [current] = await db
      .select(responseColumns)
      .from(resumes)
      .where(eq(resumes.applicantId, userId));
    if (!current) throw new HttpError("Resume not found", 404);
    return toResponse(current);
  },
};
