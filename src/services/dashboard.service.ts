import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { latestApplicationOnly } from "@/db/predicates";
import { applications, companies, jobs, profiles, resumes } from "@/db/schema";
import { openListingService } from "@/services/open-listing.service";
import { toApplicantStatus } from "@/types/applications";
import type {
  ApplicantDashboardResponse,
  DashboardResponse,
} from "@/validators/dashboard.validator";

const RECENT_LIMIT = 5;
const APPLICANT_RECENT_LIMIT = 4;
const BEST_MATCH_LIMIT = 3;

const countWhere = (condition: ReturnType<typeof sql>) =>
  sql<number>`count(*) filter (where ${condition})`.mapWith(Number);

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
          shortlisted: countWhere(sql`${applications.status} in ('shortlisted', 'interview')`),
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
      openListingService.listBestMatches(userId, resume ?? null, BEST_MATCH_LIMIT),
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
        status: toApplicantStatus(row.status),
        createdAt: row.createdAt.toISOString(),
      })),
      bestMatches: bestMatches.flatMap(({ id, title, companyName, location, match }) =>
        match ? [{ id, title, companyName, location, match }] : [],
      ),
    };
  },
};
