import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { applications, jobs, jobSkills, profiles, resumes, skills } from "@/db/schema";
import { retryDatabaseRead } from "@/lib/database/retry";
import model from "@/lib/matching/model.json";
import { bandFromScore } from "@/lib/matching/score";
import {
  ADMIN_DASHBOARD_DAYS,
  ADMIN_DASHBOARD_TOP_SKILLS,
  type AdminDashboardResponse,
} from "@/validators/admin-dashboard.validator";

const MS_PER_DAY = 86_400_000;

function utcDaySeries(now: Date): string[] {
  const todayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Array.from({ length: ADMIN_DASHBOARD_DAYS }, (_, index) =>
    new Date(todayStart - (ADMIN_DASHBOARD_DAYS - 1 - index) * MS_PER_DAY)
      .toISOString()
      .slice(0, 10),
  );
}

type DashboardQueryRow = {
  user_total: number;
  applicant_users: number;
  recruiter_users: number;
  administrator_users: number;
  active_users: number;
  pending_users: number;
  pending_recruiters: number;
  rejected_users: number;
  suspended_users: number;
  open_listings: number;
  closed_listings: number;
  removed_listings: number;
  preparing_listings: number;
  hidden_open_listings: number;
  open_listings_without_applications: number;
  total_applications: number;
  average_match_score: number | null;
  strong_applications: number;
  fair_applications: number;
  weak_applications: number;
  applications_per_day: { date: string; count: number }[];
  top_skills: { name: string; count: number }[];
  failed_resumes: number;
};

export const adminDashboardService = {
  async get(): Promise<AdminDashboardResponse> {
    return retryDatabaseRead(async () => {
      const days = utcDaySeries(new Date());
      const windowStart = new Date(`${days[0]}T00:00:00.000Z`);
      const [row] = await db.execute<DashboardQueryRow>(sql`
        with user_counts as (
          select
            count(*)::int as user_total,
            count(*) filter (where ${profiles.role} = 'applicant')::int as applicant_users,
            count(*) filter (where ${profiles.role} = 'recruiter')::int as recruiter_users,
            count(*) filter (where ${profiles.role} = 'administrator')::int as administrator_users,
            count(*) filter (where ${profiles.accountStatus} = 'active')::int as active_users,
            count(*) filter (where ${profiles.accountStatus} = 'pending')::int as pending_users,
            count(*) filter (where ${profiles.role} = 'recruiter' and ${profiles.accountStatus} = 'pending')::int as pending_recruiters,
            count(*) filter (where ${profiles.accountStatus} = 'rejected')::int as rejected_users,
            count(*) filter (where ${profiles.accountStatus} = 'suspended')::int as suspended_users
          from ${profiles}
        ), job_counts as (
          select
            count(*) filter (where ${jobs.status} = 'open')::int as open_listings,
            count(*) filter (where ${jobs.status} = 'closed')::int as closed_listings,
            count(*) filter (where ${jobs.status} = 'removed')::int as removed_listings,
            count(*) filter (where ${jobs.matchReady} = false)::int as preparing_listings,
            count(*) filter (where ${jobs.status} = 'open' and exists (select 1 from ${profiles} where ${profiles.id} = ${jobs.recruiterId} and ${profiles.accountStatus} <> 'active'))::int as hidden_open_listings,
            count(*) filter (where ${jobs.status} = 'open' and not exists (select 1 from ${applications} where ${applications.jobId} = ${jobs.id}))::int as open_listings_without_applications
          from ${jobs}
        ), application_counts as (
          select
            count(*)::int as total_applications,
            avg(${applications.matchScore})::float8 as average_match_score,
            count(*) filter (where ${applications.band} = 'strong')::int as strong_applications,
            count(*) filter (where ${applications.band} = 'fair')::int as fair_applications,
            count(*) filter (where ${applications.band} = 'weak')::int as weak_applications
          from ${applications}
        ), application_days as (
          select
            to_char(${applications.createdAt} at time zone 'UTC', 'YYYY-MM-DD') as date,
            count(*)::int as count
          from ${applications}
          where ${applications.createdAt} >= ${windowStart.toISOString()}::timestamptz
          group by 1
        ), top_skills as (
          select ${skills.name} as name, count(*)::int as count
          from ${jobSkills}
          inner join ${skills} on ${skills.id} = ${jobSkills.skillId}
          inner join ${jobs} on ${jobs.id} = ${jobSkills.jobId}
          where ${jobs.status} = 'open'
          group by ${skills.id}, ${skills.name}
          order by count(*) desc, ${skills.name}
          limit ${ADMIN_DASHBOARD_TOP_SKILLS}
        ), resume_counts as (
          select count(*) filter (where ${resumes.state} = 'failed')::int as failed_resumes
          from ${resumes}
        )
        select
          user_counts.*, job_counts.*, application_counts.*, resume_counts.*,
          coalesce((select json_agg(json_build_object('date', date, 'count', count) order by date) from application_days), '[]'::json) as applications_per_day,
          coalesce((select json_agg(json_build_object('name', name, 'count', count) order by count desc, name) from top_skills), '[]'::json) as top_skills
        from user_counts
        cross join job_counts
        cross join application_counts
        cross join resume_counts
      `);

      if (!row) throw new Error("Administrator dashboard query returned no data");

      const countByDay = new Map(row.applications_per_day.map((item) => [item.date, item.count]));
      const averageMatchScore =
        row.average_match_score === null ? null : Math.round(row.average_match_score * 10) / 10;

      return {
        totalUsers: row.user_total,
        usersByRole: {
          applicant: row.applicant_users,
          recruiter: row.recruiter_users,
          administrator: row.administrator_users,
        },
        usersByStatus: {
          active: row.active_users,
          pending: row.pending_users,
          rejected: row.rejected_users,
          suspended: row.suspended_users,
        },
        listingsByStatus: {
          open: row.open_listings,
          closed: row.closed_listings,
          removed: row.removed_listings,
        },
        totalApplications: row.total_applications,
        applicationsPerDay: days.map((date) => ({ date, count: countByDay.get(date) ?? 0 })),
        averageMatchScore,
        averageMatchBand: averageMatchScore === null ? null : bandFromScore(averageMatchScore),
        topSkills: row.top_skills,
        openListingsWithoutApplications: row.open_listings_without_applications,
        attention: {
          pendingRecruiters: row.pending_recruiters,
          openListingsWithoutApplications: row.open_listings_without_applications,
          preparingListings: row.preparing_listings,
        },
        hiddenOpenListings: row.hidden_open_listings,
        matchBands: {
          strong: row.strong_applications,
          fair: row.fair_applications,
          weak: row.weak_applications,
        },
        matcher: {
          model: model.model,
          version: model.version,
          skillCount: model.skillCount,
          pairs: model.pairs,
          trainedAt: model.trainedAt,
          resumesFailed: row.failed_resumes,
        },
      };
    });
  },
};
