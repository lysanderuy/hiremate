import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { applications, companies, jobSkills, jobs, resumes, skills } from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/escape-like";
import { scoreMatch } from "@/lib/matching/score";
import { toApplicantStatus } from "@/types/applications";
import type { EmploymentType } from "@/types/jobs";
import type { ResumeState } from "@/types/resumes";
import {
  OPEN_LISTING_PAGE_SIZE,
  type ListOpenListingsQuery,
  type MatchStatus,
  type MatchSummary,
  type OpenListingDetailResponse,
  type OpenListingListResponse,
  type OpenListingSummaryResponse,
} from "@/validators/open-listing.validator";

export type ResumeContext = { state: ResumeState; skills: string[] } | null;

const listingColumns = {
  id: jobs.id,
  title: jobs.title,
  companyName: companies.name,
  location: jobs.location,
  employmentType: jobs.employmentType,
  salaryMin: jobs.salaryMin,
  salaryMax: jobs.salaryMax,
  createdAt: jobs.createdAt,
};

type ListingRow = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: Date;
};

async function loadResume(userId: string): Promise<ResumeContext> {
  const [row] = await db
    .select({ state: resumes.state, skills: resumes.skills })
    .from(resumes)
    .where(eq(resumes.applicantId, userId));
  return row ?? null;
}

async function loadSkillNames(jobIds: string[]): Promise<Map<string, string[]>> {
  const byJob = new Map<string, string[]>();
  if (jobIds.length === 0) return byJob;

  const rows = await db
    .select({ jobId: jobSkills.jobId, name: skills.name })
    .from(jobSkills)
    .innerJoin(skills, eq(skills.id, jobSkills.skillId))
    .where(inArray(jobSkills.jobId, jobIds))
    .orderBy(skills.name);

  for (const { jobId, name } of rows) {
    const list = byJob.get(jobId) ?? [];
    list.push(name);
    byJob.set(jobId, list);
  }
  return byJob;
}

async function loadApplications(
  userId: string,
  jobIds: string[],
): Promise<Map<string, OpenListingSummaryResponse["application"]>> {
  const byJob = new Map<string, OpenListingSummaryResponse["application"]>();
  if (jobIds.length === 0) return byJob;

  const rows = await db
    .select({ id: applications.id, jobId: applications.jobId, status: applications.status })
    .from(applications)
    .where(and(eq(applications.applicantId, userId), inArray(applications.jobId, jobIds)));

  for (const row of rows) {
    byJob.set(row.jobId, { id: row.id, status: toApplicantStatus(row.status) });
  }
  return byJob;
}

function computeMatch(
  resume: ResumeContext,
  jobSkillNames: string[],
): { match: MatchSummary | null; matchStatus: MatchStatus } {
  if (!resume) return { match: null, matchStatus: "no_resume" };
  if (resume.state !== "ready") return { match: null, matchStatus: "resume_not_ready" };

  const result = scoreMatch(resume.skills, jobSkillNames);
  if (!result) return { match: null, matchStatus: "no_listing_skills" };
  return { match: result, matchStatus: "ok" };
}

async function decorate(
  userId: string,
  rows: ListingRow[],
  resume: ResumeContext,
): Promise<OpenListingSummaryResponse[]> {
  const ids = rows.map((row) => row.id);
  const [skillsByJob, applicationByJob] = await Promise.all([
    loadSkillNames(ids),
    loadApplications(userId, ids),
  ]);

  return rows.map((row) => {
    const jobSkillNames = skillsByJob.get(row.id) ?? [];
    return {
      id: row.id,
      title: row.title,
      companyName: row.companyName,
      location: row.location,
      employmentType: row.employmentType as EmploymentType,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      createdAt: row.createdAt.toISOString(),
      skills: jobSkillNames,
      ...computeMatch(resume, jobSkillNames),
      application: applicationByJob.get(row.id) ?? null,
    };
  });
}

// Overlap ratio of a listing's skills with the caller's ready resume; null when the listing has none.
function matchRatio(userId: string) {
  const total = sql`(select count(*) from ${jobSkills} where ${jobSkills.jobId} = ${jobs.id})`;
  const matched = sql`(
    select count(*) from ${jobSkills}
    inner join ${skills} on ${skills.id} = ${jobSkills.skillId}
    where ${jobSkills.jobId} = ${jobs.id}
      and ${skills.name} in (
        select unnest(${resumes.skills}) from ${resumes}
        where ${resumes.applicantId} = ${userId} and ${resumes.state} = 'ready'
      )
  )`;
  return sql<number | null>`case when ${total} = 0 then null else ${matched}::float / ${total} end`;
}

function filterConditions({ q, location, type, minPay }: ListOpenListingsQuery): SQL[] {
  const conditions: SQL[] = [eq(jobs.status, "open")];

  if (q) {
    const pattern = `%${escapeLike(q)}%`;
    const textMatch = or(
      ilike(jobs.title, pattern),
      ilike(companies.name, pattern),
      ilike(jobs.description, pattern),
    );
    if (textMatch) conditions.push(textMatch);
  }
  if (location) conditions.push(ilike(jobs.location, `%${escapeLike(location)}%`));
  if (type) conditions.push(eq(jobs.employmentType, type));
  if (minPay !== undefined) conditions.push(gte(jobs.salaryMax, minPay));

  return conditions;
}

export const openListingService = {
  async list(userId: string, query: ListOpenListingsQuery): Promise<OpenListingListResponse> {
    const resume = await loadResume(userId);
    const where = and(...filterConditions(query));

    const orderBy =
      query.sort === "best_match" && resume?.state === "ready"
        ? [sql`${matchRatio(userId)} desc nulls last`, desc(jobs.createdAt), desc(jobs.id)]
        : [desc(jobs.createdAt), desc(jobs.id)];

    const [rows, [totalRow]] = await Promise.all([
      db
        .select(listingColumns)
        .from(jobs)
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .where(where)
        .orderBy(...orderBy)
        .limit(OPEN_LISTING_PAGE_SIZE)
        .offset((query.page - 1) * OPEN_LISTING_PAGE_SIZE),
      db
        .select({ total: count() })
        .from(jobs)
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .where(where),
    ]);

    return {
      items: await decorate(userId, rows, resume),
      total: totalRow.total,
      page: query.page,
      pageSize: OPEN_LISTING_PAGE_SIZE,
    };
  },

  async getById(userId: string, id: string): Promise<OpenListingDetailResponse> {
    const [row] = await db
      .select({ ...listingColumns, description: jobs.description })
      .from(jobs)
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .where(and(eq(jobs.id, id), eq(jobs.status, "open")));
    if (!row) throw new HttpError("Listing not found", 404);

    const [item] = await decorate(userId, [row], await loadResume(userId));
    return { ...item, description: row.description };
  },

  async listBestMatches(
    userId: string,
    resume: ResumeContext,
    limit: number,
  ): Promise<OpenListingSummaryResponse[]> {
    if (resume?.state !== "ready") return [];

    const ratio = matchRatio(userId);
    const rows = await db
      .select(listingColumns)
      .from(jobs)
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .where(
        and(
          eq(jobs.status, "open"),
          sql`${ratio} > 0`,
          sql`not exists (
            select 1 from ${applications}
            where ${applications.jobId} = ${jobs.id} and ${applications.applicantId} = ${userId}
          )`,
        ),
      )
      .orderBy(sql`${ratio} desc`, desc(jobs.createdAt), desc(jobs.id))
      .limit(limit);

    return decorate(userId, rows, resume);
  },
};
