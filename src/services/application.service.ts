import "server-only";

import { and, count, desc, eq, ilike, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { applications, jobs, profiles, type Application } from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/escape-like";
import type {
  ApplicationDetailResponse,
  ApplicationListResponse,
  ApplicationSummaryResponse,
  ListApplicationsQuery,
  UpdateApplicationStatusInput,
} from "@/validators/application.validator";

const summaryColumns = {
  id: applications.id,
  jobId: applications.jobId,
  applicantName: profiles.displayName,
  skillsMatched: applications.skillsMatched,
  skillsMissing: applications.skillsMissing,
  status: applications.status,
  createdAt: applications.createdAt,
  statusChangedAt: applications.statusChangedAt,
  matchScore: applications.matchScore,
  band: applications.band,
};

const detailColumns = {
  ...summaryColumns,
  applicantEmail: profiles.email,
  resumeSnapshot: applications.resumeSnapshot,
  viewedAt: applications.viewedAt,
  jobTitle: jobs.title,
};

type SummaryRow = Pick<
  Application,
  | "id"
  | "jobId"
  | "skillsMatched"
  | "skillsMissing"
  | "status"
  | "createdAt"
  | "statusChangedAt"
  | "matchScore"
  | "band"
> & { applicantName: string | null };
type DetailRow = SummaryRow &
  Pick<Application, "resumeSnapshot" | "viewedAt"> & { applicantEmail: string; jobTitle: string };

function toSummary(row: SummaryRow): ApplicationSummaryResponse {
  return {
    id: row.id,
    jobId: row.jobId,
    applicantName: row.applicantName,
    skillsMatched: row.skillsMatched,
    skillsMissing: row.skillsMissing,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    statusChangedAt: row.statusChangedAt.toISOString(),
    matchScore: row.matchScore,
    band: row.band,
  };
}

function toDetail(row: DetailRow): ApplicationDetailResponse {
  return {
    ...toSummary(row),
    applicantEmail: row.applicantEmail,
    resumeSnapshot: row.resumeSnapshot,
    viewedAt: row.viewedAt ? row.viewedAt.toISOString() : null,
    jobTitle: row.jobTitle,
  };
}

function selectDetail(executor: Pick<typeof db, "select">, userId: string, id: string) {
  return executor
    .select(detailColumns)
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .innerJoin(profiles, eq(profiles.id, applications.applicantId))
    .where(and(eq(applications.id, id), eq(jobs.recruiterId, userId)));
}

function orderBy(sort: ListApplicationsQuery["sort"]) {
  if (sort === "newest") return [desc(applications.createdAt)];
  if (sort === "name")
    return [sql`${profiles.displayName} asc nulls last`, desc(applications.createdAt)];
  return [sql`${applications.matchScore} desc nulls last`, desc(applications.createdAt)];
}

const bandScoreRange = {
  strong: sql`${applications.matchScore} >= 70`,
  fair: sql`${applications.matchScore} between 40 and 69`,
  weak: sql`${applications.matchScore} <= 39`,
};

function notFound(): HttpError {
  return new HttpError("Application not found", 404);
}

export const applicationService = {
  async listForListing(
    userId: string,
    listingId: string,
    { status, search, band, sort }: ListApplicationsQuery,
  ): Promise<ApplicationListResponse> {
    const [job] = await db
      .select({ id: jobs.id })
      .from(jobs)
      .where(and(eq(jobs.id, listingId), eq(jobs.recruiterId, userId)));
    if (!job) throw new HttpError("Listing not found", 404);

    const pattern = search ? `%${escapeLike(search)}%` : undefined;

    const baseConditions = [
      eq(applications.jobId, listingId),
      pattern ? ilike(profiles.displayName, pattern) : undefined,
      band ? bandScoreRange[band] : undefined,
    ];

    const [rows, countRows] = await Promise.all([
      db
        .select(summaryColumns)
        .from(applications)
        .innerJoin(profiles, eq(profiles.id, applications.applicantId))
        .where(and(...baseConditions, status ? eq(applications.status, status) : undefined))
        .orderBy(...orderBy(sort)),
      db
        .select({ status: applications.status, total: count() })
        .from(applications)
        .innerJoin(profiles, eq(profiles.id, applications.applicantId))
        .where(and(...baseConditions))
        .groupBy(applications.status),
    ]);

    const counts: ApplicationListResponse["counts"] = {
      all: 0,
      submitted: 0,
      viewed: 0,
      shortlisted: 0,
      interview: 0,
      rejected: 0,
      withdrawn: 0,
    };
    for (const row of countRows) {
      counts[row.status] = row.total;
      counts.all += row.total;
    }

    return { items: rows.map(toSummary), counts };
  },

  async getById(userId: string, id: string): Promise<ApplicationDetailResponse> {
    const [row] = await selectDetail(db, userId, id);
    if (!row) throw notFound();
    if (row.status !== "submitted") return toDetail(row);

    const now = new Date();
    const updated = await db
      .update(applications)
      .set({ status: "viewed", viewedAt: now, statusChangedAt: now })
      .where(
        and(
          eq(applications.id, id),
          eq(applications.status, "submitted"),
          inArray(
            applications.jobId,
            db.select({ id: jobs.id }).from(jobs).where(eq(jobs.recruiterId, userId)),
          ),
        ),
      )
      .returning({ id: applications.id });

    if (updated.length > 0) {
      return toDetail({ ...row, status: "viewed", viewedAt: now, statusChangedAt: now });
    }

    const [current] = await selectDetail(db, userId, id);
    if (!current) throw notFound();
    return toDetail(current);
  },

  async updateStatus(
    userId: string,
    id: string,
    status: UpdateApplicationStatusInput["status"],
  ): Promise<ApplicationDetailResponse> {
    return db.transaction(async (tx) => {
      const [row] = await selectDetail(tx, userId, id).for("update", { of: applications });
      if (!row) throw notFound();

      if (row.status === "withdrawn") {
        throw new HttpError("This application was withdrawn by the applicant.", 409);
      }
      if (row.status === status) return toDetail(row);

      const now = new Date();
      const viewedAt = row.viewedAt ?? now;
      await tx
        .update(applications)
        .set({ status, statusChangedAt: now, viewedAt })
        .where(eq(applications.id, id));

      return toDetail({ ...row, status, statusChangedAt: now, viewedAt });
    });
  },
};
