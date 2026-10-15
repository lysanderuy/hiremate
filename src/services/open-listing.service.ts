import "server-only";

import { and, count, desc, eq, gte, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { applications, companies, jobSkills, jobs, profiles, resumes, skills } from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/escape-like";
import { matchPair, type MatchPairResult } from "@/lib/matching/match-pair";
import { listingService } from "@/services/listing.service";
import { toApplicantStatus } from "@/types/applications";
import type { EmploymentType } from "@/types/jobs";
import type { ResumeState } from "@/types/resumes";
import {
  OPEN_LISTING_PAGE_SIZE,
  type ListOpenListingsQuery,
  type OpenListingDetailResponse,
  type OpenListingListResponse,
  type OpenListingSummaryResponse,
} from "@/validators/open-listing.validator";

export type ResumeContext = {
  state: ResumeState;
  skills: string[];
  embedding: number[] | null;
} | null;

const BEST_MATCH_CANDIDATE_LIMIT = 500;

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

const candidateColumns = {
  ...listingColumns,
  embedding: jobs.embedding,
  matchReady: jobs.matchReady,
};

type ListingRow = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: Date;
};

type JobMatchData = { embedding: number[] | null; matchReady: boolean };

type ScoredListing = { row: ListingRow; skills: string[]; result: MatchPairResult };

async function loadResume(userId: string): Promise<ResumeContext> {
  const [row] = await db
    .select({ state: resumes.state, skills: resumes.skills, embedding: resumes.embedding })
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

async function loadJobMatchData(jobIds: string[]): Promise<Map<string, JobMatchData>> {
  const byJob = new Map<string, JobMatchData>();
  if (jobIds.length === 0) return byJob;

  const rows = await db
    .select({ id: jobs.id, embedding: jobs.embedding, matchReady: jobs.matchReady })
    .from(jobs)
    .where(inArray(jobs.id, jobIds));
  for (const { id, embedding, matchReady } of rows) byJob.set(id, { embedding, matchReady });
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
    if (row.status === "withdrawn") continue;
    byJob.set(row.jobId, { id: row.id, status: toApplicantStatus(row.status) });
  }
  return byJob;
}

function computeMatch(
  resume: ResumeContext,
  jobSkillNames: string[],
  jobData: JobMatchData | undefined,
): MatchPairResult {
  return matchPair(
    resume
      ? { skills: resume.skills, embedding: resume.state === "ready" ? resume.embedding : null }
      : null,
    {
      skills: jobSkillNames,
      embedding: jobData?.embedding ?? null,
      matchReady: jobData?.matchReady ?? false,
    },
  );
}

function toSummary(
  row: ListingRow,
  jobSkillNames: string[],
  { match, skillsMatch, status }: MatchPairResult,
  application: OpenListingSummaryResponse["application"],
): OpenListingSummaryResponse {
  return {
    id: row.id,
    title: row.title,
    companyName: row.companyName,
    location: row.location,
    employmentType: row.employmentType,
    salaryMin: row.salaryMin,
    salaryMax: row.salaryMax,
    createdAt: row.createdAt.toISOString(),
    skills: jobSkillNames,
    match,
    skillsMatch,
    matchStatus: status,
    application,
  };
}

async function decorate(
  userId: string,
  rows: ListingRow[],
  resume: ResumeContext,
): Promise<OpenListingSummaryResponse[]> {
  const ids = rows.map((row) => row.id);
  const [skillsByJob, applicationByJob, dataByJob] = await Promise.all([
    loadSkillNames(ids),
    loadApplications(userId, ids),
    loadJobMatchData(ids),
  ]);

  return rows.map((row) => {
    const jobSkillNames = skillsByJob.get(row.id) ?? [];
    return toSummary(
      row,
      jobSkillNames,
      computeMatch(resume, jobSkillNames, dataByJob.get(row.id)),
      applicationByJob.get(row.id) ?? null,
    );
  });
}

async function scoreCandidates(
  rows: (ListingRow & JobMatchData)[],
  resume: ResumeContext,
): Promise<ScoredListing[]> {
  const skillsByJob = await loadSkillNames(rows.map((row) => row.id));
  return rows.map((row) => {
    const jobSkillNames = skillsByJob.get(row.id) ?? [];
    return { row, skills: jobSkillNames, result: computeMatch(resume, jobSkillNames, row) };
  });
}

function compareByScore(a: ScoredListing, b: ScoredListing): number {
  const scoreA = a.result.match?.score ?? -1;
  const scoreB = b.result.match?.score ?? -1;
  if (scoreA !== scoreB) return scoreB - scoreA;
  const byDate = b.row.createdAt.getTime() - a.row.createdAt.getTime();
  if (byDate !== 0) return byDate;
  if (a.row.id === b.row.id) return 0;
  return a.row.id < b.row.id ? 1 : -1;
}

const visibleListing: SQL[] = [eq(jobs.status, "open"), eq(profiles.accountStatus, "active")];

function filterConditions({ q, location, type, minPay }: ListOpenListingsQuery): SQL[] {
  const conditions: SQL[] = [...visibleListing];

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
    const offset = (query.page - 1) * OPEN_LISTING_PAGE_SIZE;

    const totalQuery = db
      .select({ total: count() })
      .from(jobs)
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
      .where(where);

    if (query.sort === "best_match" && resume?.state === "ready") {
      const [candidates, [totalRow]] = await Promise.all([
        db
          .select(candidateColumns)
          .from(jobs)
          .innerJoin(companies, eq(companies.id, jobs.companyId))
          .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
          .where(where)
          .orderBy(desc(jobs.createdAt), desc(jobs.id))
          .limit(BEST_MATCH_CANDIDATE_LIMIT),
        totalQuery,
      ]);

      const pageItems = (await scoreCandidates(candidates, resume))
        .sort(compareByScore)
        .slice(offset, offset + OPEN_LISTING_PAGE_SIZE);
      const applicationByJob = await loadApplications(
        userId,
        pageItems.map(({ row }) => row.id),
      );

      return {
        items: pageItems.map(({ row, skills: jobSkillNames, result }) =>
          toSummary(row, jobSkillNames, result, applicationByJob.get(row.id) ?? null),
        ),
        total: Math.min(totalRow.total, BEST_MATCH_CANDIDATE_LIMIT),
        page: query.page,
        pageSize: OPEN_LISTING_PAGE_SIZE,
      };
    }

    const [rows, [totalRow]] = await Promise.all([
      db
        .select(listingColumns)
        .from(jobs)
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
        .where(where)
        .orderBy(desc(jobs.createdAt), desc(jobs.id))
        .limit(OPEN_LISTING_PAGE_SIZE)
        .offset(offset),
      totalQuery,
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
      .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
      .where(and(eq(jobs.id, id), ...visibleListing));
    if (!row) throw new HttpError("Listing not found", 404);

    const jobData = (await loadJobMatchData([id])).get(id);
    if (!jobData?.matchReady || !jobData.embedding) await listingService.prepareForViewer(id);

    const [item] = await decorate(userId, [row], await loadResume(userId));
    return { ...item, description: row.description };
  },

  async listBestMatches(
    userId: string,
    resume: ResumeContext,
    limit: number,
  ): Promise<OpenListingSummaryResponse[]> {
    if (resume?.state !== "ready") return [];

    const candidates = await db
      .select(candidateColumns)
      .from(jobs)
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
      .where(
        and(
          ...visibleListing,
          sql`not exists (
            select 1 from ${applications}
            where ${applications.jobId} = ${jobs.id} and ${applications.applicantId} = ${userId}
              and ${applications.status} <> 'withdrawn'
          )`,
        ),
      )
      .orderBy(desc(jobs.createdAt), desc(jobs.id))
      .limit(BEST_MATCH_CANDIDATE_LIMIT);

    return (await scoreCandidates(candidates, resume))
      .filter(({ result }) => result.match !== null && result.match.band !== "weak")
      .sort(compareByScore)
      .slice(0, limit)
      .map(({ row, skills: jobSkillNames, result }) => toSummary(row, jobSkillNames, result, null));
  },
};
