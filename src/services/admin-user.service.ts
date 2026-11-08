import "server-only";

import { and, count, desc, eq, ilike, ne, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { applications, companies, jobs, profiles, resumes } from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import { escapeLike } from "@/lib/escape-like";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  ADMIN_USER_PAGE_SIZE,
  type AdminUserDetailResponse,
  type AdminUserListResponse,
  type AdminUserResultResponse,
  type ListAdminUsersQuery,
} from "@/validators/admin-user.validator";

const BAN_FOREVER = "876000h";

async function setSignInBlock(userId: string, banDuration: string): Promise<string | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;

  try {
    const { error } = await admin.auth.admin.updateUserById(userId, { ban_duration: banDuration });
    return error ? error.message : null;
  } catch (error) {
    return error instanceof Error ? error.message : "Unknown error";
  }
}

async function failSuspend(targetId: string): Promise<never> {
  const target = await db.query.profiles.findFirst({
    where: eq(profiles.id, targetId),
    columns: { role: true },
  });
  if (!target) throw new HttpError("User not found", 404);
  if (target.role === "administrator") {
    throw new HttpError("Administrators cannot be suspended.", 403);
  }
  throw new HttpError("This account is already suspended.", 409);
}

export const adminUserService = {
  async list({ q, role, status, page }: ListAdminUsersQuery): Promise<AdminUserListResponse> {
    const conditions: SQL[] = [];
    if (q) {
      const pattern = `%${escapeLike(q)}%`;
      const match = or(ilike(profiles.displayName, pattern), ilike(profiles.email, pattern));
      if (match) conditions.push(match);
    }
    if (role) conditions.push(eq(profiles.role, role));
    if (status) conditions.push(eq(profiles.accountStatus, status));
    const where = and(...conditions);

    const [rows, [totals]] = await Promise.all([
      db
        .select({
          id: profiles.id,
          displayName: profiles.displayName,
          email: profiles.email,
          role: profiles.role,
          accountStatus: profiles.accountStatus,
          createdAt: profiles.createdAt,
        })
        .from(profiles)
        .where(where)
        .orderBy(desc(profiles.createdAt), desc(profiles.id))
        .limit(ADMIN_USER_PAGE_SIZE)
        .offset((page - 1) * ADMIN_USER_PAGE_SIZE),
      db.select({ total: count() }).from(profiles).where(where),
    ]);

    return {
      items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      total: totals?.total ?? 0,
      page,
      pageSize: ADMIN_USER_PAGE_SIZE,
    };
  },

  async getById(id: string): Promise<AdminUserDetailResponse> {
    const [row] = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        email: profiles.email,
        role: profiles.role,
        accountStatus: profiles.accountStatus,
        createdAt: profiles.createdAt,
        rejectionReason: profiles.rejectionReason,
        jobTitle: profiles.jobTitle,
        approvedAt: profiles.approvedAt,
        companyName: companies.name,
      })
      .from(profiles)
      .leftJoin(companies, eq(companies.ownerId, profiles.id))
      .where(eq(profiles.id, id))
      .limit(1);
    if (!row) throw new HttpError("User not found", 404);

    const base = {
      id: row.id,
      displayName: row.displayName,
      email: row.email,
      role: row.role,
      accountStatus: row.accountStatus,
      createdAt: row.createdAt.toISOString(),
      rejectionReason: row.rejectionReason,
      companyName: null,
      jobTitle: null,
      approvedAt: null,
      listingCount: null,
      openListingCount: null,
      applicationCount: null,
      resumeState: null,
    };

    if (row.role === "recruiter") {
      const [counts] = await db
        .select({
          total: count(),
          open: sql<number>`count(*) filter (where ${jobs.status} = 'open')`.mapWith(Number),
        })
        .from(jobs)
        .where(eq(jobs.recruiterId, id));
      return {
        ...base,
        companyName: row.companyName,
        jobTitle: row.jobTitle,
        approvedAt: row.approvedAt?.toISOString() ?? null,
        listingCount: counts?.total ?? 0,
        openListingCount: counts?.open ?? 0,
      };
    }

    if (row.role === "applicant") {
      const [[applicationRow], resume] = await Promise.all([
        db.select({ total: count() }).from(applications).where(eq(applications.applicantId, id)),
        db.query.resumes.findFirst({
          where: eq(resumes.applicantId, id),
          columns: { state: true },
        }),
      ]);
      return {
        ...base,
        applicationCount: applicationRow?.total ?? 0,
        resumeState: resume?.state ?? "none",
      };
    }

    return base;
  },

  async suspend(actorId: string, targetId: string): Promise<AdminUserResultResponse> {
    if (actorId === targetId) throw new HttpError("You cannot suspend your own account.", 403);

    const [updated] = await db
      .update(profiles)
      .set({
        accountStatus: "suspended",
        suspendedFrom: sql`${profiles.accountStatus}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(profiles.id, targetId),
          ne(profiles.role, "administrator"),
          ne(profiles.accountStatus, "suspended"),
        ),
      )
      .returning({ id: profiles.id, accountStatus: profiles.accountStatus });

    if (!updated) return failSuspend(targetId);

    // The DB status already blocks access; a failed ban must not fail the save.
    const failure = await setSignInBlock(targetId, BAN_FOREVER);
    if (failure) console.error("Could not block sign-in for suspended user", targetId, failure);

    return updated;
  },

  async reactivate(targetId: string): Promise<AdminUserResultResponse> {
    const target = await db.query.profiles.findFirst({
      where: eq(profiles.id, targetId),
      columns: { accountStatus: true },
    });
    if (!target) throw new HttpError("User not found", 404);
    if (target.accountStatus !== "suspended") {
      throw new HttpError("This account is not suspended.", 409);
    }

    // Unban first so a failure leaves the account suspended and the call retryable.
    const failure = await setSignInBlock(targetId, "none");
    if (failure) {
      console.error("Could not lift sign-in block for user", targetId, failure);
      throw new HttpError("The sign-in block could not be lifted. Try again.", 502);
    }

    const [updated] = await db
      .update(profiles)
      .set({
        accountStatus: sql`coalesce(${profiles.suspendedFrom}, case when ${profiles.role} = 'recruiter' and ${profiles.approvedAt} is null then 'pending' else 'active' end)::account_status`,
        suspendedFrom: null,
        updatedAt: new Date(),
      })
      .where(and(eq(profiles.id, targetId), eq(profiles.accountStatus, "suspended")))
      .returning({ id: profiles.id, accountStatus: profiles.accountStatus });

    if (!updated) throw new HttpError("This account is not suspended.", 409);
    return updated;
  },
};
