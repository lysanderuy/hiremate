import "server-only";

import { and, count, desc, eq, inArray, max, notInArray } from "drizzle-orm";

import { db } from "@/db";
import { applications, companies, jobSkills, jobs, skills, type Job } from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import { skillService, type DbExecutor } from "@/services/skill.service";
import type { EmploymentType } from "@/types/jobs";
import type { CreateListingInput, UpdateListingInput } from "@/validators/listing.validator";
import type { SkillResponse } from "@/validators/skill.validator";

export type ListingView = Omit<Job, "employmentType"> & {
  employmentType: EmploymentType;
  skills: SkillResponse[];
  applicantCount: number;
  topMatchScore: number | null;
};

type ApplicantStats = { total: number; topMatchScore: number | null };
const NO_APPLICANTS: ApplicantStats = { total: 0, topMatchScore: null };

const REMOVED_MESSAGE = "Removed by an administrator.";
const SKILLS_INVALID_MESSAGE = "One or more skills are not in the skills list.";

function toView(job: Job, jobSkillList: SkillResponse[], stats: ApplicantStats): ListingView {
  return {
    ...job,
    employmentType: job.employmentType as EmploymentType,
    skills: jobSkillList,
    applicantCount: stats.total,
    topMatchScore: stats.topMatchScore,
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
    })
    .from(applications)
    .where(inArray(applications.jobId, jobIds))
    .groupBy(applications.jobId);

  return new Map(rows.map((row) => [row.jobId, row]));
}

async function assertSkillsActive(ids: string[], executor: DbExecutor): Promise<void> {
  if (ids.length === 0) return;
  const found = await skillService.getActiveByIds(ids, executor);
  if (found.length !== new Set(ids).size) throw new HttpError(SKILLS_INVALID_MESSAGE, 422);
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

    await db.transaction(async (tx) => {
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

      let matchInvalidated =
        (fields.title !== undefined && fields.title !== job.title) ||
        (fields.description !== undefined && fields.description !== job.description);

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
        if (toAdd.length > 0 || toRemove.length > 0) matchInvalidated = true;
      }

      if (matchInvalidated) changes.matchReady = false;

      await tx
        .update(jobs)
        .set({ ...changes, updatedAt: new Date() })
        .where(and(eq(jobs.id, id), eq(jobs.recruiterId, userId)));
    });

    return listingService.getById(userId, id);
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
