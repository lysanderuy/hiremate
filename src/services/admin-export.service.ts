import "server-only";

import { desc, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import { applications, companies, jobs, profiles } from "@/db/schema";
import type { CsvCell } from "@/lib/csv/to-csv";

export type AdminExport = { headers: string[]; rows: CsvCell[][] };

const EXPORT_ROW_LIMIT = 10_000;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export const adminExportService = {
  async users(): Promise<AdminExport> {
    const rows = await db
      .select({
        displayName: profiles.displayName,
        email: profiles.email,
        role: profiles.role,
        accountStatus: profiles.accountStatus,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .orderBy(desc(profiles.createdAt), desc(profiles.id))
      .limit(EXPORT_ROW_LIMIT);

    return {
      headers: ["Display name", "Email", "Role", "Account status", "Signed up"],
      rows: rows.map((row) => [
        row.displayName,
        row.email,
        row.role,
        row.accountStatus,
        isoDate(row.createdAt),
      ]),
    };
  },

  async listings(): Promise<AdminExport> {
    const rows = await db
      .select({
        title: jobs.title,
        company: companies.name,
        recruiterName: profiles.displayName,
        recruiterEmail: profiles.email,
        location: jobs.location,
        employmentType: jobs.employmentType,
        salaryMin: jobs.salaryMin,
        salaryMax: jobs.salaryMax,
        status: jobs.status,
        createdAt: jobs.createdAt,
        applicationCount:
          sql<number>`(select count(*) from applications a where a.job_id = "jobs"."id")`.mapWith(
            Number,
          ),
      })
      .from(jobs)
      .innerJoin(companies, eq(companies.id, jobs.companyId))
      .innerJoin(profiles, eq(profiles.id, jobs.recruiterId))
      .orderBy(desc(jobs.createdAt), desc(jobs.id))
      .limit(EXPORT_ROW_LIMIT);

    return {
      headers: [
        "Title",
        "Company",
        "Recruiter",
        "Location",
        "Employment type",
        "Salary min",
        "Salary max",
        "Status",
        "Created",
        "Applications",
      ],
      rows: rows.map((row) => [
        row.title,
        row.company,
        row.recruiterName ?? row.recruiterEmail,
        row.location,
        row.employmentType,
        row.salaryMin,
        row.salaryMax,
        row.status,
        isoDate(row.createdAt),
        row.applicationCount,
      ]),
    };
  },

  async applications(): Promise<AdminExport> {
    const applicant = alias(profiles, "applicant");
    const rows = await db
      .select({
        listingTitle: jobs.title,
        applicantName: applicant.displayName,
        matchScore: applications.matchScore,
        band: applications.band,
        status: applications.status,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .innerJoin(jobs, eq(jobs.id, applications.jobId))
      .innerJoin(applicant, eq(applicant.id, applications.applicantId))
      .orderBy(desc(applications.createdAt), desc(applications.id))
      .limit(EXPORT_ROW_LIMIT);

    return {
      headers: ["Listing title", "Applicant name", "Match score", "Band", "Status", "Applied"],
      rows: rows.map((row) => [
        row.listingTitle,
        row.applicantName ?? "Unnamed applicant",
        row.matchScore,
        row.band,
        row.status,
        isoDate(row.createdAt),
      ]),
    };
  },
};
