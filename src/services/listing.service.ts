import "server-only";

import { and, count, desc, eq, inArray, max, ne, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { latestApplicationOnly } from "@/db/predicates";
import { applications, companies, jobSkills, jobs, skills, type Job } from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import {
  matcherService,
  MatcherUnavailableError,
  PREPARE_COOLDOWN_MESSAGE,
  prepareCooldownElapsed,
} from "@/services/matcher.service";
import { skillService, type DbExecutor } from "@/services/skill.service";
import type { MatchBand } from "@/validators/application.validator";
import type { CreateListingInput, UpdateListingInput } from "@/validators/listing.validator";
import type { SkillResponse } from "@/validators/skill.validator";

type ListingRow = Omit<Job, "embedding" | "prepareAttemptedAt">;

export type ListingView = ListingRow & {
  skills: SkillResponse[];
  applicantCount: number;
  topMatchScore: number | null;
  topMatchBand: MatchBand | null;
};

type ApplicantStats = {
  total: number;
  topMatchScore: number | null;
  topMatchBand: MatchBand | null;
};
const NO_APPLICANTS: ApplicantStats = { total: 0, topMatchScore: null, topMatchBand: null };

const REMOVED_MESSAGE = "Removed by an administrator.";
const SKILLS_INVALID_MESSAGE = "One or more skills are not in the skills list.";

function omit<T extends object, K extends keyof T>(value: T, keys: K[]): Omit<T, K> {
  const copy = { ...value };
  for (const key of keys) delete copy[key];
  return copy;
}

function toView(job: Job, jobSkillList: SkillResponse[], stats: ApplicantStats): ListingView {
  return {
    ...omit(job, ["embedding", "prepareAttemptedAt"]),
    skills: jobSkillList,
    applicantCount: stats.total,
    topMatchScore: stats.topMatchScore,
    topMatchBand: stats.topMatchBand,
  };
}

async function loadSkillsByJobIds(
  jobIds: string[],
  executor: DbExecutor = db,
): Promise<Map<string, SkillResponse[]>> {
  const byJob = new Map<string, SkillResponse[]>();
  if (jobIds.length === 0) return byJob;

  const rows = await executor
    .select({ jobId: jobSkills.jobId, id: skills.id, name: skills.name })
    .from(jobSkills)
    .innerJoin(skills, eq(skills.id, jobSkills.skillId))
    .where(inArray(jobSkills.jobId, jobIds))
    .orderBy(skills.name);

  for (const { jobId, id, name } of rows) {
    const list = byJob.get(jobId) ?? [];
    list.push({ id, name });
    byJob.set(jobId, list);
  }
  return byJob;
}

async function loadApplicantStats(jobIds: string[]): Promise<Map<string, ApplicantStats>> {
  if (jobIds.length === 0) return new Map();

  const rows = await db
    .select({
      jobId: applications.jobId,
      total: count(),
      topMatchScore: max(applications.matchScore),
      topMatchBand: sql<MatchBand | null>`(array_agg(${applications.band} order by ${applications.matchScore} desc))[1]`,
    })
    .from(applications)
    .where(
      and(
        inArray(applications.jobId, jobIds),
        ne(applications.status, "withdrawn"),
        latestApplicationOnly,
      ),
    )
    .groupBy(applications.jobId);

  return new Map(rows.map((row) => [row.jobId, row]));
}

async function assertSkillsActive(ids: string[], executor: DbExecutor): Promise<void> {
  if (ids.length === 0) return;
  const found = await skillService.getActiveByIds(ids, executor);
  if (found.length !== new Set(ids).size) throw new HttpError(SKILLS_INVALID_MESSAGE, 422);
}

async function embedDescription(userId: string, id: string, description: string): Promise<void> {
  const embedding = await matcherService.tryEmbedOne("listing", description);
  if (!embedding) return;
  await storeEmbedding(userId, id, description, embedding);
}

async function storeEmbedding(
  userId: string,
  id: string,
  description: string,
  embedding: number[],
): Promise<boolean> {
  const stored = await db
    .update(jobs)
    .set({ embedding, matchReady: true })
    .where(and(eq(jobs.id, id), eq(jobs.recruiterId, userId), eq(jobs.description, description)))
    .returning({ id: jobs.id });
  return stored.length > 0;
}

async function storeEmbeddingForViewer(
  id: string,
  description: string,
  embedding: number[],
): Promise<void> {
  await db
    .update(jobs)
    .set({ embedding, matchReady: true })
    .where(and(eq(jobs.id, id), eq(jobs.description, description)));
}

export const listingService = {
  async create(userId: string, input: CreateListingInput): Promise<ListingView> {
    const company = await db.query.companies.findFirst({
      where: eq(companies.ownerId, userId),
    });
    if (!company) {
      throw new HttpError("Add your company name in Profile before posting a listing.", 409);
    }

    const { skillIds, ...fields } = input;

    const jobId = await db.transaction(async (tx) => {
      await assertSkillsActive(skillIds, tx);

      const [job] = await tx
        .insert(jobs)
        .values({
          ...fields,
          status: "open",
          matchReady: false,
          companyId: company.id,
          recruiterId: userId,
        })
        .returning({ id: jobs.id });

      if (skillIds.length > 0) {
        await tx.insert(jobSkills).values(skillIds.map((skillId) => ({ jobId: job.id, skillId })));
      }
      return job.id;
    });

    await embedDescription(userId, jobId, fields.description);

    return listingService.getById(userId, jobId);
  },

  async list(userId: string): Promise<ListingView[]> {
    const rows = await db
      .select()
      .from(jobs)
      .where(eq(jobs.recruiterId, userId))
      .orderBy(desc(jobs.createdAt));

    const jobIds = rows.map((job) => job.id);
    const [skillsByJob, statsByJob] = await Promise.all([
      loadSkillsByJobIds(jobIds),
      loadApplicantStats(jobIds),
    ]);

    return rows.map((job) =>
      toView(job, skillsByJob.get(job.id) ?? [], statsByJob.get(job.id) ?? NO_APPLICANTS),
    );
  },

  async getById(userId: string, id: string): Promise<ListingView> {
    const [job] = await db
      .select()
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.recruiterId, userId)));
    if (!job) throw new HttpError("Listing not found", 404);

    const [skillsByJob, statsByJob] = await Promise.all([
      loadSkillsByJobIds([id]),
      loadApplicantStats([id]),
    ]);

    return toView(job, skillsByJob.get(id) ?? [], statsByJob.get(id) ?? NO_APPLICANTS);
  },

  async update(userId: string, id: string, input: UpdateListingInput): Promise<ListingView> {
    const { skillIds, status, salaryMin, salaryMax, ...fields } = input;

    const descriptionToEmbed = await db.transaction(async (tx) => {
      // Row lock serialises concurrent edits of the same listing.
      const [job] = await tx
        .select()
        .from(jobs)
        .where(and(eq(jobs.id, id), eq(jobs.recruiterId, userId)))
        .for("update");
      if (!job) throw new HttpError("Listing not found", 404);
      if (job.status === "removed") throw new HttpError(REMOVED_MESSAGE, 403);

      const changes: Partial<typeof jobs.$inferInsert> = { ...fields };
      if (salaryMin !== undefined) changes.salaryMin = salaryMin;
      if (salaryMax !== undefined) changes.salaryMax = salaryMax;
      if (status !== undefined && status !== job.status) changes.status = status;

      const descriptionChanged =
        fields.description !== undefined && fields.description !== job.description;
      if (descriptionChanged) {
        changes.matchReady = false;
        changes.embedding = null;
        changes.prepareAttemptedAt = null;
      }

      if (skillIds !== undefined) {
        const current = await tx
          .select({ skillId: jobSkills.skillId })
          .from(jobSkills)
          .where(eq(jobSkills.jobId, id));
        const currentIds = new Set(current.map((row) => row.skillId));
        const nextIds = new Set(skillIds);
        const toAdd = skillIds.filter((skillId) => !currentIds.has(skillId));
        const toRemove = [...currentIds].filter((skillId) => !nextIds.has(skillId));

        await assertSkillsActive(toAdd, tx);

        if (skillIds.length === 0) {
          await tx.delete(jobSkills).where(eq(jobSkills.jobId, id));
        } else if (toRemove.length > 0) {
          await tx
            .delete(jobSkills)
            .where(and(eq(jobSkills.jobId, id), notInArray(jobSkills.skillId, skillIds)));
        }
        if (toAdd.length > 0) {
          await tx.insert(jobSkills).values(toAdd.map((skillId) => ({ jobId: id, skillId })));
        }
      }

      await tx
        .update(jobs)
        .set({ ...changes, updatedAt: new Date() })
        .where(and(eq(jobs.id, id), eq(jobs.recruiterId, userId)));

      return descriptionChanged ? fields.description : undefined;
    });

    if (descriptionToEmbed !== undefined) await embedDescription(userId, id, descriptionToEmbed);

    return listingService.getById(userId, id);
  },

  async prepareById(userId: string, id: string): Promise<ListingView> {
    const [job] = await db
      .select({
        status: jobs.status,
        matchReady: jobs.matchReady,
        hasEmbedding: sql<boolean>`${jobs.embedding} is not null`,
      })
      .from(jobs)
      .where(and(eq(jobs.id, id), eq(jobs.recruiterId, userId)));
    if (!job) throw new HttpError("Listing not found", 404);
    if (job.status === "removed") throw new HttpError(REMOVED_MESSAGE, 403);
    if (job.matchReady && job.hasEmbedding) return listingService.getById(userId, id);

    const [claimed] = await db
      .update(jobs)
      .set({ prepareAttemptedAt: sql`now()` })
      .where(
        and(
          eq(jobs.id, id),
          eq(jobs.recruiterId, userId),
          ne(jobs.status, "removed"),
          prepareCooldownElapsed(jobs.prepareAttemptedAt),
        ),
      )
      .returning({ description: jobs.description });
    if (!claimed) throw new HttpError(PREPARE_COOLDOWN_MESSAGE, 429);

    let embedding: number[];
    try {
      [embedding] = await matcherService.embed("listing", [claimed.description]);
    } catch (error) {
      console.error(
        "[matcher] listing embedding failed",
        error instanceof MatcherUnavailableError ? error.message : "unknown error",
      );
      throw new HttpError("Matching is temporarily unavailable. Please try again.", 503);
    }

    await storeEmbedding(userId, id, claimed.description, embedding);
    return listingService.getById(userId, id);
  },

  async prepareForViewer(id: string): Promise<void> {
    const [claimed] = await db
      .update(jobs)
      .set({ prepareAttemptedAt: sql`now()` })
      .where(
        and(
          eq(jobs.id, id),
          eq(jobs.status, "open"),
          sql`(${jobs.embedding} is null or ${jobs.matchReady} = false)`,
          prepareCooldownElapsed(jobs.prepareAttemptedAt),
        ),
      )
      .returning({ description: jobs.description });
    if (!claimed) return;

    const embedding = await matcherService.tryEmbedOne("listing", claimed.description);
    if (!embedding) return;
    await storeEmbeddingForViewer(id, claimed.description, embedding);
  },

  async remove(userId: string, id: string): Promise<{ id: string }> {
    await db.transaction(async (tx) => {
      const [job] = await tx
        .select({ id: jobs.id, status: jobs.status })
        .from(jobs)
        .where(and(eq(jobs.id, id), eq(jobs.recruiterId, userId)))
        .for("update");
      if (!job) throw new HttpError("Listing not found", 404);
      if (job.status === "removed") throw new HttpError(REMOVED_MESSAGE, 403);

      const [existing] = await tx
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.jobId, id))
        .limit(1);
      if (existing) throw new HttpError("Close this listing instead. It has applications.", 409);

      await tx.delete(jobs).where(and(eq(jobs.id, id), eq(jobs.recruiterId, userId)));
    });

    return { id };
  },
};
