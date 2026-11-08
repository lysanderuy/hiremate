import "server-only";

import { and, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { applications, companies, jobs, jobSkills, profiles, skills } from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/escape-like";
import {
  ADMIN_LISTING_PAGE_SIZE,
  type AdminListingDetailResponse,
  type AdminListingListResponse,
  type AdminListingResultResponse,
  type ListAdminListingsQuery,
} from "@/validators/admin-listing.validator";

async function failModeration(id: string, conflictMessage: string): Promise<never> {
  const existing = await db.query.jobs.findFirst({
    where: eq(jobs.id, id),
    columns: { id: true },
  });
  if (!existing) throw new HttpError("Listing not found", 404);
  throw new HttpError(conflictMessage, 409);
}

const applicationCountSql = sql<number>`(select count(*)::int from ${applications} where ${applications.jobId} = ${jobs.id})`;

const hiddenSql = sql<boolean>`(${jobs.status} = 'open' and ${profiles.accountStatus} <> 'active')`;

const listingColumns = {
  id: jobs.id,
  title: jobs.title,
  companyName: companies.name,
  recruiterDisplayName: profiles.displayName,
  recruiterEmail: profiles.email,
  location: jobs.location,
  employmentType: jobs.employmentType,
  status: jobs.status,
  matchReady: jobs.matchReady,
  hidden: hiddenSql,
  salaryMin: jobs.salaryMin,
  salaryMax: jobs.salaryMax,
  removalReason: jobs.removalReason,
  applicationCount: applicationCountSql,
  createdAt: jobs.createdAt,
};

type ListingRow = {
  recruiterDisplayName: string | null;
  recruiterEmail: string;
  createdAt: Date;
};

function toListing<T extends ListingRow>({
  recruiterDisplayName,
  recruiterEmail,
  createdAt,
  ...row
}: T) {
  return {
    ...row,
    recruiterName: recruiterDisplayName ?? recruiterEmail,
    createdAt: createdAt.toISOString(),
  };
}

export const adminListingService = {
  async list({
    q,
    status,
    noApplications,
    preparing,
    page,
  }: ListAdminListingsQuery): Promise<AdminListingListResponse> {
    const searchConditions: SQL[] = [];
    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      const match = or(ilike(jobs.title, pattern), ilike(companies.name, pattern));
      if (match) searchConditions.push(match);
    }
    const conditions = [...searchConditions];
    if (status) conditions.push(eq(jobs.status, status));
    if (noApplications) {
      conditions.push(
        eq(jobs.status, "open"),
        sql`not exists (select 1 from ${applications} where ${applications.jobId} = ${jobs.id})`,
      );
    }
    if (preparing) conditions.push(eq(jobs.matchReady, false));
    const where = and(...conditions);

    const [rows, [totals], statusCounts] = await Promise.all([
      db
        .select(listingColumns)
        .from(jobs)
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
        .where(where)
        .orderBy(desc(jobs.createdAt), desc(jobs.id))
        .limit(ADMIN_LISTING_PAGE_SIZE)
        .offset((page - 1) * ADMIN_LISTING_PAGE_SIZE),
      db
        .select({ total: count() })
        .from(jobs)
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .where(where),
      db
        .select({ status: jobs.status, total: count() })
        .from(jobs)
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .where(and(...searchConditions))
        .groupBy(jobs.status),
    ]);

    const byStatus = new Map(statusCounts.map((row) => [row.status, row.total]));
    const open = byStatus.get("open") ?? 0;
    const closed = byStatus.get("closed") ?? 0;
    const removed = byStatus.get("removed") ?? 0;

    return {
      items: rows.map(toListing),
      total: totals?.total ?? 0,
      page,
      pageSize: ADMIN_LISTING_PAGE_SIZE,
      counts: { all: open + closed + removed, open, closed, removed },
    };
  },

  async getById(id: string): Promise<AdminListingDetailResponse> {
    const [row] = await db
      .select({ ...listingColumns, description: jobs.description })
      .from(jobs)
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
      .where(eq(jobs.id, id))
      .limit(1);
    if (!row) throw new HttpError("Listing not found", 404);

    const skillRows = await db
      .select({ name: skills.name })
      .from(jobSkills)
      .innerJoin(skills, eq(skills.id, jobSkills.skillId))
      .where(eq(jobSkills.jobId, id))
      .orderBy(skills.name);

    return { ...toListing(row), skills: skillRows.map((skill) => skill.name) };
  },

  async remove(id: string, reason: string | undefined): Promise<AdminListingResultResponse> {
    const [updated] = await db
      .update(jobs)
      .set({ status: "removed", removalReason: reason?.trim() || null, updatedAt: new Date() })
      .where(and(eq(jobs.id, id), inArray(jobs.status, ["open", "closed"])))
      .returning({ id: jobs.id, status: jobs.status });

    if (!updated) return failModeration(id, "This listing is already removed.");
    return updated;
  },

  async restore(id: string): Promise<AdminListingResultResponse> {
    const [updated] = await db
      .update(jobs)
      .set({ status: "closed", removalReason: null, updatedAt: new Date() })
      .where(and(eq(jobs.id, id), eq(jobs.status, "removed")))
      .returning({ id: jobs.id, status: jobs.status });

    if (!updated) return failModeration(id, "This listing is not removed.");
    return updated;
  },
};
