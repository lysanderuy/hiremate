import "server-only";

import { and, asc, eq, isNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { companies, profiles } from "@/db/schema";
import { HttpError } from "@/lib/api/errors";
import type {
  ApprovalResultResponse,
  PendingRecruiterResponse,
} from "@/validators/approval.validator";

const REVIEW_COOLDOWN_MS = 24 * 60 * 60 * 1000;

const isPendingRecruiter = (id: string) =>
  and(eq(profiles.id, id), eq(profiles.role, "recruiter"), eq(profiles.accountStatus, "pending"));

async function failReview(id: string): Promise<never> {
  const existing = await db.query.profiles.findFirst({
    where: and(eq(profiles.id, id), eq(profiles.role, "recruiter")),
    columns: { id: true },
  });
  if (!existing) throw new HttpError("Recruiter not found", 404);
  throw new HttpError("This account is not awaiting approval.", 409);
}

export const approvalService = {
  async listPending(): Promise<PendingRecruiterResponse[]> {
    const rows = await db
      .select({
        id: profiles.id,
        displayName: profiles.displayName,
        email: profiles.email,
        jobTitle: profiles.jobTitle,
        companyName: companies.name,
        createdAt: profiles.createdAt,
      })
      .from(profiles)
      .leftJoin(companies, eq(companies.ownerId, profiles.id))
      .where(and(eq(profiles.role, "recruiter"), eq(profiles.accountStatus, "pending")))
      .orderBy(asc(profiles.createdAt));

    return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  },

  async approve(id: string): Promise<{ id: string }> {
    const now = new Date();
    const [updated] = await db
      .update(profiles)
      .set({
        accountStatus: "active",
        approvedAt: sql`coalesce(${profiles.approvedAt}, ${now.toISOString()}::timestamptz)`,
        rejectionReason: null,
        updatedAt: now,
      })
      .where(isPendingRecruiter(id))
      .returning({ id: profiles.id });

    if (!updated) return failReview(id);
    return updated;
  },

  async reject(id: string, reason: string | undefined): Promise<{ id: string }> {
    const [updated] = await db
      .update(profiles)
      .set({
        accountStatus: "rejected",
        rejectionReason: reason?.trim() || null,
        updatedAt: new Date(),
      })
      .where(isPendingRecruiter(id))
      .returning({ id: profiles.id });

    if (!updated) return failReview(id);
    return updated;
  },

  async requestReview(userId: string): Promise<ApprovalResultResponse> {
    const now = new Date();
    const cutoff = new Date(now.getTime() - REVIEW_COOLDOWN_MS);
    const [updated] = await db
      .update(profiles)
      .set({
        accountStatus: "pending",
        rejectionReason: null,
        reviewRequestedAt: now,
        updatedAt: now,
      })
      .where(
        and(
          eq(profiles.id, userId),
          eq(profiles.role, "recruiter"),
          eq(profiles.accountStatus, "rejected"),
          or(isNull(profiles.reviewRequestedAt), lt(profiles.reviewRequestedAt, cutoff)),
        ),
      )
      .returning({ id: profiles.id });

    if (updated) return updated;

    const current = await db.query.profiles.findFirst({
      where: eq(profiles.id, userId),
      columns: { accountStatus: true, role: true },
    });
    if (current?.role === "recruiter" && current.accountStatus === "rejected") {
      throw new HttpError("You can request another review 24 hours after your last request.", 429);
    }
    throw new HttpError("Your account is not awaiting a new review.", 409);
  },
};
