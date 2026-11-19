import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import { latestApplicationOnly } from "@/db/predicates";
import { applications, jobs, profiles } from "@/db/schema";
import type { CsvCell } from "@/lib/csv/to-csv";

export type RecruiterExport = { headers: string[]; rows: CsvCell[][] };

const EXPORT_ROW_LIMIT = 10_000;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const recruiterExportService = {
  async applications(userId: string): Promise<RecruiterExport> {
    const applicant = alias(profiles, "applicant");
    const rows = await db
      .select({
        listingTitle: jobs.title,
        applicantName: applicant.displayName,
        applicantEmail: applicant.email,
        matchScore: applications.matchScore,
        band: applications.band,
        status: applications.status,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(applicant, eq(applicant.id, applications.applicantId))
      .where(and(eq(jobs.recruiterId, userId), latestApplicationOnly))
      .orderBy(desc(applications.createdAt), desc(applications.id))
      .limit(EXPORT_ROW_LIMIT);

    return {
      headers: [
        "Listing title",
        "Applicant name",
        "Applicant email",
        "Match score",
        "Band",
        "Status",
        "Applied",
      ],
      rows: rows.map((row) => [
        row.listingTitle,
        row.applicantName ?? "Unnamed applicant",
        row.applicantEmail,
        row.matchScore,
        row.band,
        row.status,
        isoDate(row.createdAt),
      ]),
    };
  },
};
