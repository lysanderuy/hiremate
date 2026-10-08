import "server-only";

import { and, count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { applications, jobs, profiles } from "@/db/schema";
import type { DashboardResponse } from "@/validators/dashboard.validator";

const RECENT_LIMIT = 5;

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
        .where(eq(jobs.recruiterId, userId)),
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
          status: applications.status,
          createdAt: applications.createdAt,
        })
        .from(applications)
        .innerJoin(jobs, eq(jobs.id, applications.jobId))
        .innerJoin(profiles, eq(profiles.id, applications.applicantId))
        .where(eq(jobs.recruiterId, userId))
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
};
