import "server-only";

import { desc, eq, gte, sql } from "drizzle-orm";

import { db } from "@/db";
import { applications, jobs, jobSkills, profiles, resumes, skills } from "@/db/schema";
import model from "@/lib/matching/model.json";
import { bandFromScore } from "@/lib/matching/score";
import {
  ADMIN_DASHBOARD_DAYS,
  ADMIN_DASHBOARD_TOP_SKILLS,
  type AdminDashboardResponse,
} from "@/validators/admin-dashboard.validator";

const MS_PER_DAY = 86_400_000;

function countWhere(condition: ReturnType<typeof sql>) {
  return sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
}

function utcDaySeries(now: Date): string[] {
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: ADMIN_DASHBOARD_DAYS }, (_, index) =>
    new Date(todayStart - (ADMIN_DASHBOARD_DAYS - 1 - index) * MS_PER_DAY)
      .toISOString()
      .slice(0, 10),
  );
}

export const adminDashboardService = {
  async get(): Promise<AdminDashboardResponse> {
    const days = utcDaySeries(new Date());
    const windowStart = new Date(`${days[0]}T00:00:00.000Z`);
    const dayExpr = sql<string>`to_char(${applications.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;

    const [[userRow], [jobRow], [applicationRow], perDay, topSkills, [resumeRow]] =
      await Promise.all([
        db
          .select({
            total: sql<number>`count(*)`.mapWith(Number),
            applicant: countWhere(sql`${profiles.role} = 'applicant'`),
            recruiter: countWhere(sql`${profiles.role} = 'recruiter'`),
            administrator: countWhere(sql`${profiles.role} = 'administrator'`),
            active: countWhere(sql`${profiles.accountStatus} = 'active'`),
            pending: countWhere(sql`${profiles.accountStatus} = 'pending'`),
            pendingRecruiters: countWhere(
              sql`${profiles.role} = 'recruiter' and ${profiles.accountStatus} = 'pending'`,
            ),
            rejected: countWhere(sql`${profiles.accountStatus} = 'rejected'`),
            suspended: countWhere(sql`${profiles.accountStatus} = 'suspended'`),
          })
          .from(profiles),
        db
          .select({
            open: countWhere(sql`${jobs.status} = 'open'`),
            closed: countWhere(sql`${jobs.status} = 'closed'`),
            removed: countWhere(sql`${jobs.status} = 'removed'`),
            preparing: countWhere(sql`${jobs.matchReady} = false`),
            hiddenOpen: countWhere(
              sql`${jobs.status} = 'open' and exists (select 1 from profiles p where p.id = "jobs"."recruiter_id" and p.account_status <> 'active')`,
            ),
            openWithoutApplications: countWhere(
              sql`${jobs.status} = 'open' and not exists (select 1 from applications a where a.job_id = "jobs"."id")`,
            ),
          })
          .from(jobs),
        db
          .select({
            total: sql<number>`count(*)`.mapWith(Number),
            average: sql<string | null>`avg(${applications.matchScore})`,
            strong: countWhere(sql`${applications.band} = 'strong'`),
            fair: countWhere(sql`${applications.band} = 'fair'`),
            weak: countWhere(sql`${applications.band} = 'weak'`),
          })
          .from(applications),
        db
          .select({ day: dayExpr, count: sql<number>`count(*)`.mapWith(Number) })
          .from(applications)
          .where(gte(applications.createdAt, windowStart))
          .groupBy(sql`1`),
        db
          .select({ name: skills.name, count: sql<number>`count(*)`.mapWith(Number) })
          .from(jobSkills)
          .innerJoin(skills, eq(skills.id, jobSkills.skillId))
          .innerJoin(jobs, eq(jobs.id, jobSkills.jobId))
          .where(eq(jobs.status, "open"))
          .groupBy(skills.id, skills.name)
          .orderBy(desc(sql`count(*)`), skills.name)
          .limit(ADMIN_DASHBOARD_TOP_SKILLS),
        db.select({ failed: countWhere(sql`${resumes.state} = 'failed'`) }).from(resumes),
      ]);

    const countByDay = new Map(perDay.map((row) => [row.day, row.count]));
    const average = applicationRow?.average;
    const averageMatchScore =
      average === null || average === undefined ? null : Math.round(Number(average) * 10) / 10;

    return {
      totalUsers: userRow?.total ?? 0,
      usersByRole: {
        applicant: userRow?.applicant ?? 0,
        recruiter: userRow?.recruiter ?? 0,
        administrator: userRow?.administrator ?? 0,
      },
      usersByStatus: {
        active: userRow?.active ?? 0,
        pending: userRow?.pending ?? 0,
        rejected: userRow?.rejected ?? 0,
        suspended: userRow?.suspended ?? 0,
      },
      listingsByStatus: {
        open: jobRow?.open ?? 0,
        closed: jobRow?.closed ?? 0,
        removed: jobRow?.removed ?? 0,
      },
      totalApplications: applicationRow?.total ?? 0,
      applicationsPerDay: days.map((date) => ({ date, count: countByDay.get(date) ?? 0 })),
      averageMatchScore,
      averageMatchBand: averageMatchScore === null ? null : bandFromScore(averageMatchScore),
      topSkills,
      openListingsWithoutApplications: jobRow?.openWithoutApplications ?? 0,
      attention: {
        pendingRecruiters: userRow?.pendingRecruiters ?? 0,
        openListingsWithoutApplications: jobRow?.openWithoutApplications ?? 0,
        preparingListings: jobRow?.preparing ?? 0,
      },
      hiddenOpenListings: jobRow?.hiddenOpen ?? 0,
      matchBands: {
        strong: applicationRow?.strong ?? 0,
        fair: applicationRow?.fair ?? 0,
        weak: applicationRow?.weak ?? 0,
      },
      matcher: {
        model: model.model,
        version: model.version,
        skillCount: model.skillCount,
        pairs: model.pairs,
        trainedAt: model.trainedAt,
        resumesFailed: resumeRow?.failed ?? 0,
      },
    };
  },
};
