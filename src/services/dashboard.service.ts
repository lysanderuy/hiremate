import "server-only";

import { and, count, desc, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { latestApplicationOnly } from "@/db/predicates";
import { applications, companies, jobSkills, jobs, profiles, resumes, skills } from "@/db/schema";
import { matchPair, type MatchPairResult } from "@/lib/matching/match-pair";
import type { EmploymentType } from "@/types/jobs";
import type { ResumeState } from "@/types/resumes";
import type {
  ApplicantDashboardResponse,
  DashboardResponse,
} from "@/validators/dashboard.validator";
import type { OpenListingSummaryResponse } from "@/validators/open-listing.validator";

const RECENT_LIMIT = 5;
const APPLICANT_RECENT_LIMIT = 4;
const BEST_MATCH_LIMIT = 3;
const BEST_MATCH_CANDIDATE_LIMIT = 500;

const countWhere = (condition: ReturnType<typeof sql>) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

type ResumeMatchContext = {
  state: ResumeState;
  skills: string[];
  embedding: number[] | null;
} | null;

type MatchListingRow = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  salaryMin: number | null;
  salaryMax: number | null;
  createdAt: Date;
  embedding: number[] | null;
  matchReady: boolean;
};

type ScoredListing = {
  row: MatchListingRow;
  skills: string[];
  result: MatchPairResult;
};

const matchListingColumns = {
  id: jobs.id,
  title: jobs.title,
  companyName: companies.name,
  location: jobs.location,
  employmentType: jobs.employmentType,
  salaryMin: jobs.salaryMin,
  salaryMax: jobs.salaryMax,
  createdAt: jobs.createdAt,
  embedding: jobs.embedding,
  matchReady: jobs.matchReady,
};

async function loadJobSkillNames(jobIds: string[]): Promise<Map<string, string[]>> {
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

function compareByMatchScore(a: ScoredListing, b: ScoredListing): number {
  const scoreA = a.result.match?.score ?? -1;
  const scoreB = b.result.match?.score ?? -1;
  if (scoreA !== scoreB) return scoreB - scoreA;
  const byDate = b.row.createdAt.getTime() - a.row.createdAt.getTime();
  if (byDate !== 0) return byDate;
  if (a.row.id === b.row.id) return 0;
  return a.row.id < b.row.id ? 1 : -1;
}

async function listBestMatches(
  userId: string,
  resume: ResumeMatchContext,
  limit: number,
): Promise<OpenListingSummaryResponse[]> {
  if (resume?.state !== "ready") return [];

  const candidates = await db
    .select(matchListingColumns)
    .from(jobs)
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
    .where(
      and(
        eq(jobs.status, "open"),
        eq(profiles.accountStatus, "active"),
        sql`not exists (
          select 1 from ${applications}
          where ${applications.jobId} = ${jobs.id} and ${applications.applicantId} = ${userId}
            and ${applications.status} <> 'withdrawn'
        )`,
      ),
    )
    .orderBy(desc(jobs.createdAt), desc(jobs.id))
    .limit(BEST_MATCH_CANDIDATE_LIMIT);
  const skillsByJob = await loadJobSkillNames(candidates.map((candidate) => candidate.id));

  return candidates
    .map((row) => {
      const jobSkillNames = skillsByJob.get(row.id) ?? [];
      return {
        row,
        skills: jobSkillNames,
        result: matchPair(
          { skills: resume.skills, embedding: resume.embedding },
          {
            skills: jobSkillNames,
            embedding: row.embedding,
            matchReady: row.matchReady,
          },
        ),
      };
    })
    .filter(({ result }) => result.match !== null && result.match.band !== "weak")
    .sort(compareByMatchScore)
    .slice(0, limit)
    .map(({ row, skills: jobSkillNames, result }) => ({
      id: row.id,
      title: row.title,
      companyName: row.companyName,
      location: row.location,
      employmentType: row.employmentType,
      salaryMin: row.salaryMin,
      salaryMax: row.salaryMax,
      createdAt: row.createdAt.toISOString(),
      skills: jobSkillNames,
      match: result.match,
      skillsMatch: result.skillsMatch,
      matchStatus: result.status,
      application: null,
    }));
}

export const dashboardService = {
  async get(userId: string): Promise<DashboardResponse> {
    const [[applicationStats], [jobStats], recent] = await Promise.all([
      db
        .select({
          total: count(),
          shortlisted: countWhere(sql`${applications.status} = 'shortlisted'`),
          interviews: countWhere(sql`${applications.status} = 'interview'`),
          awaitingReview: countWhere(sql`${applications.status} = 'submitted'`),
          last7Days: countWhere(sql`${applications.createdAt} >= now() - interval '7 days'`),
        })
        .from(applications)
        .innerJoin(jobs, eq(jobs.id, applications.jobId))
        .where(and(eq(jobs.recruiterId, userId), latestApplicationOnly)),
      db
        .select({ open: count() })
        .from(jobs)
        .where(and(eq(jobs.recruiterId, userId), eq(jobs.status, "open"))),
      db
        .select({
          id: applications.id,
          jobId: applications.jobId,
          jobTitle: jobs.title,
          applicantName: profiles.displayName,
          matchScore: applications.matchScore,
          band: applications.band,
          status: applications.status,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .innerJoin(jobs, eq(jobs.id, applications.jobId))
        .innerJoin(profiles, eq(profiles.id, applications.applicantId))
        .where(and(eq(jobs.recruiterId, userId), latestApplicationOnly))
        .orderBy(desc(applications.createdAt), desc(applications.id))
        .limit(RECENT_LIMIT),
    ]);

    return {
      stats: {
        activeJobs: jobStats.open,
        totalApplicants: applicationStats.total,
        shortlisted: applicationStats.shortlisted,
        interviews: applicationStats.interviews,
        awaitingReview: applicationStats.awaitingReview,
        last7Days: applicationStats.last7Days,
      },
      recentApplications: recent.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
    };
  },

  async getApplicant(userId: string): Promise<ApplicantDashboardResponse> {
    const [resume] = await db
      .select({
        state: resumes.state,
        source: resumes.source,
        skills: resumes.skills,
        embedding: resumes.embedding,
        updatedAt: resumes.updatedAt,
      })
      .from(resumes)
      .where(eq(resumes.applicantId, userId));

    const [[stats], recent, bestMatches] = await Promise.all([
      db
        .select({
          total: count(),
          shortlisted: countWhere(sql`${applications.status} = 'shortlisted'`),
          interviews: countWhere(sql`${applications.status} = 'interview'`),
          waiting: countWhere(sql`${applications.status} = 'submitted'`),
        })
        .from(applications)
        .where(eq(applications.applicantId, userId)),
      db
        .select({
          id: applications.id,
          jobTitle: jobs.title,
          companyName: companies.name,
          status: applications.status,
          matchScore: applications.matchScore,
          band: applications.band,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .innerJoin(jobs, eq(jobs.id, applications.jobId))
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .where(eq(applications.applicantId, userId))
        .orderBy(desc(applications.createdAt), desc(applications.id))
        .limit(APPLICANT_RECENT_LIMIT),
      listBestMatches(userId, resume ?? null, BEST_MATCH_LIMIT),
    ]);

    return {
      resume: {
        state: resume?.state ?? null,
        source: resume?.source ?? null,
        skillCount: resume?.skills.length ?? 0,
        updatedAt: resume ? resume.updatedAt.toISOString() : null,
      },
      applications: stats,
      recent: recent.map((row) => ({
        ...row,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      })),
      bestMatches: bestMatches.flatMap(({ id, title, companyName, location, match }) =>
        match ? [{ id, title, companyName, location, match }] : [],
      ),
    };
  },
};
