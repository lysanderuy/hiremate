import "server-only";

import { and, count, desc, eq, ilike, inArray, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { latestApplicationOnly } from "@/db/predicates";
import {
  applications,
  companies,
  jobSkills,
  jobs,
  profiles,
  resumeFiles,
  resumes,
  skills,
  type Application,
} from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/escape-like";
import { scoreMatch } from "@/lib/matching/score";
import {
  canWithdraw,
  toApplicantStatus,
  type ApplicantApplicationStatus,
} from "@/types/applications";
import type { EmploymentType } from "@/types/jobs";
import type {
  ApplicationDetailResponse,
  ApplicationListResponse,
  ApplicationSummaryResponse,
  ApplyToListingInput,
  ListApplicationsQuery,
  ListMyApplicationsQuery,
  MyApplicationDetailResponse,
  MyApplicationListResponse,
  MyApplicationSummaryResponse,
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
  hasFile: sql<boolean>`${applications.resumeFileId} is not null`,
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
  Pick<Application, "viewedAt"> & {
    applicantEmail: string;
    jobTitle: string;
    hasFile: boolean;
  };

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
    hasFile: row.hasFile,
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

const mineSummaryColumns = {
  id: applications.id,
  jobId: applications.jobId,
  jobTitle: jobs.title,
  companyName: companies.name,
  location: jobs.location,
  employmentType: jobs.employmentType,
  jobStatus: jobs.status,
  status: applications.status,
  matchScore: applications.matchScore,
  band: applications.band,
  createdAt: applications.createdAt,
  statusChangedAt: applications.statusChangedAt,
};

const mineDetailColumns = {
  ...mineSummaryColumns,
  hasFile: sql<boolean>`${applications.resumeFileId} is not null`,
  skillsMatched: applications.skillsMatched,
  skillsMissing: applications.skillsMissing,
  viewedAt: applications.viewedAt,
};

type MineSummaryRow = Pick<
  Application,
  "id" | "jobId" | "status" | "matchScore" | "band" | "createdAt" | "statusChangedAt"
> & {
  jobTitle: string;
  companyName: string;
  location: string;
  employmentType: EmploymentType;
  jobStatus: MyApplicationSummaryResponse["jobStatus"];
};
type MineDetailRow = MineSummaryRow &
  Pick<Application, "skillsMatched" | "skillsMissing" | "viewedAt"> & {
    hasFile: boolean;
  };

function toMineSummary(row: MineSummaryRow): MyApplicationSummaryResponse {
  return {
    id: row.id,
    jobId: row.jobId,
    jobTitle: row.jobTitle,
    companyName: row.companyName,
    location: row.location,
    employmentType: row.employmentType,
    jobStatus: row.jobStatus,
    status: toApplicantStatus(row.status),
    matchScore: row.matchScore,
    band: row.band,
    createdAt: row.createdAt.toISOString(),
    statusChangedAt: row.statusChangedAt.toISOString(),
  };
}

function toMineDetail(row: MineDetailRow): MyApplicationDetailResponse {
  return {
    ...toMineSummary(row),
    hasFile: row.hasFile,
    skillsMatched: row.skillsMatched,
    skillsMissing: row.skillsMissing,
    viewedAt: row.viewedAt ? row.viewedAt.toISOString() : null,
  };
}

function selectMine(executor: Pick<typeof db, "select">, userId: string, id: string) {
  return executor
    .select(mineDetailColumns)
    .from(applications)
    .innerJoin(jobs, eq(jobs.id, applications.jobId))
    .innerJoin(companies, eq(companies.id, jobs.companyId))
    .where(and(eq(applications.id, id), eq(applications.applicantId, userId)));
}

const NO_FILE_MESSAGE = "No resume file on record.";

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
      latestApplicationOnly,
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

  async listMine(
    userId: string,
    { status }: ListMyApplicationsQuery,
  ): Promise<MyApplicationListResponse> {
    const statusCondition: SQL | undefined =
      status === "shortlisted"
        ? inArray(applications.status, ["shortlisted", "interview"])
        : status
          ? eq(applications.status, status)
          : undefined;

    const [rows, countRows] = await Promise.all([
      db
        .select(mineSummaryColumns)
        .from(applications)
        .innerJoin(jobs, eq(jobs.id, applications.jobId))
        .innerJoin(companies, eq(companies.id, jobs.companyId))
        .where(and(eq(applications.applicantId, userId), statusCondition))
        .orderBy(desc(applications.createdAt), desc(applications.id)),
      db
        .select({ status: applications.status, total: count() })
        .from(applications)
        .where(eq(applications.applicantId, userId))
        .groupBy(applications.status),
    ]);

    const counts: MyApplicationListResponse["counts"] = {
      all: 0,
      submitted: 0,
      viewed: 0,
      shortlisted: 0,
      rejected: 0,
      withdrawn: 0,
    };
    for (const row of countRows) {
      const mapped: ApplicantApplicationStatus = toApplicantStatus(row.status);
      counts[mapped] += row.total;
      counts.all += row.total;
    }

    return { items: rows.map(toMineSummary), counts };
  },

  async getMine(userId: string, id: string): Promise<MyApplicationDetailResponse> {
    const [row] = await selectMine(db, userId, id);
    if (!row) throw notFound();
    return toMineDetail(row);
  },

  async apply(
    userId: string,
    { listingId }: ApplyToListingInput,
  ): Promise<MyApplicationDetailResponse> {
    return db.transaction(async (tx) => {
      const [job] = await tx
        .select({ status: jobs.status, recruiterStatus: profiles.accountStatus })
        .from(jobs)
        .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
        .where(eq(jobs.id, listingId))
        .for("share", { of: jobs });
      if (!job) throw new HttpError("Listing not found", 404);
      if (job.status !== "open" || job.recruiterStatus !== "active") {
        throw new HttpError("This listing is no longer open.", 409);
      }

      const [resume] = await tx
        .select({
          text: resumes.text,
          fileId: resumes.fileId,
          state: resumes.state,
          skills: resumes.skills,
        })
        .from(resumes)
        .where(eq(resumes.applicantId, userId));
      if (!resume) throw new HttpError("Add your resume before applying.", 409);
      if (resume.state !== "ready") {
        throw new HttpError("Your resume is not ready. Save it again before applying.", 409);
      }

      if (!resume.fileId) {
        throw new HttpError("Upload your resume PDF again before applying.", 409);
      }

      const jobSkillRows = await tx
        .select({ name: skills.name })
        .from(jobSkills)
        .innerJoin(skills, eq(skills.id, jobSkills.skillId))
        .where(eq(jobSkills.jobId, listingId))
        .orderBy(skills.name);
      const result = scoreMatch(
        resume.skills,
        jobSkillRows.map((row) => row.name),
      );

      const [created] = await tx
        .insert(applications)
        .values({
          jobId: listingId,
          applicantId: userId,
          resumeSnapshot: resume.text,
          resumeFileId: resume.fileId,
          skillsMatched: result?.matched ?? [],
          skillsMissing: result?.missing ?? [],
          matchScore: result?.score ?? null,
          band: result?.band ?? null,
        })
        .onConflictDoNothing({
          target: [applications.jobId, applications.applicantId],
          where: sql`${applications.status} <> 'withdrawn'`,
        })
        .returning({ id: applications.id });
      if (!created) throw new HttpError("You already applied to this listing.", 409);

      const [row] = await selectMine(tx, userId, created.id);
      return toMineDetail(row);
    });
  },

  async getFileForRecruiter(
    recruiterId: string,
    applicationId: string,
  ): Promise<{ data: Buffer; fileName: string }> {
    const [row] = await db
      .select({ data: resumeFiles.data, fileName: resumeFiles.fileName })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(resumeFiles, eq(resumeFiles.id, applications.resumeFileId))
      .where(and(eq(applications.id, applicationId), eq(jobs.recruiterId, recruiterId)));
    if (!row) throw new HttpError(NO_FILE_MESSAGE, 404);
    return row;
  },

  async getMyFile(
    userId: string,
    applicationId: string,
  ): Promise<{ data: Buffer; fileName: string }> {
    const [row] = await db
      .select({ data: resumeFiles.data, fileName: resumeFiles.fileName })
      .from(applications)
      .innerJoin(resumeFiles, eq(resumeFiles.id, applications.resumeFileId))
      .where(and(eq(applications.id, applicationId), eq(applications.applicantId, userId)));
    if (!row) throw new HttpError(NO_FILE_MESSAGE, 404);
    return row;
  },

  async withdraw(userId: string, id: string): Promise<MyApplicationDetailResponse> {
    return db.transaction(async (tx) => {
      const [row] = await selectMine(tx, userId, id).for("update", { of: applications });
      if (!row) throw notFound();
      if (!canWithdraw(row.status)) {
        throw new HttpError("This application can no longer be withdrawn.", 409);
      }

      const now = new Date();
      await tx
        .update(applications)
        .set({ status: "withdrawn", statusChangedAt: now })
        .where(eq(applications.id, id));

      return toMineDetail({ ...row, status: "withdrawn", statusChangedAt: now });
    });
  },
};
