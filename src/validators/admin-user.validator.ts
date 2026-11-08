import { z } from "zod";

import { ACCOUNT_STATUSES, APP_ROLES } from "@/types/roles";

export const ADMIN_USER_PAGE_SIZE = 20;

export const adminUserIdSchema = z.string().uuid();

export const listAdminUsersQuerySchema = z.object({
  q: z.string().trim().max(80).optional().meta({
    description: "Case-insensitive text to match against display name and email.",
    example: "jordan",
  }),
  role: z.enum(APP_ROLES).optional().meta({
    description: "Only return users with this role.",
    example: "recruiter",
  }),
  status: z.enum(ACCOUNT_STATUSES).optional().meta({
    description: "Only return users with this account status.",
    example: "active",
  }),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(1)
    .meta({
      description: `Page number, from 1 to 1000. Page size is fixed at ${ADMIN_USER_PAGE_SIZE}.`,
      example: 1,
    }),
});

export type ListAdminUsersQuery = z.infer<typeof listAdminUsersQuerySchema>;

export const adminUserResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Profile ID.",
      example: "9d2c4f6a-1b3e-4a85-8c07-6e5d4c3b2a19",
    }),
    displayName: z.string().nullable().meta({
      description: "Display name, if set.",
      example: "Jordan Reyes",
    }),
    email: z.string().meta({ description: "Account email.", example: "jordan@acme.test" }),
    role: z.enum(APP_ROLES).meta({ description: "Account role.", example: "recruiter" }),
    accountStatus: z.enum(ACCOUNT_STATUSES).meta({
      description: "Account status.",
      example: "active",
    }),
    createdAt: z.string().datetime().meta({
      description: "Timestamp the user signed up.",
      example: "2026-01-01T00:00:00.000Z",
    }),
  })
  .meta({ id: "AdminUser", description: "A user account as seen by an administrator." });

export type AdminUserResponse = z.infer<typeof adminUserResponseSchema>;

export const ADMIN_USER_RESUME_STATES = ["ready", "failed", "none"] as const;

export const adminUserDetailResponseSchema = adminUserResponseSchema
  .extend({
    rejectionReason: z.string().nullable().meta({
      description: "Reason given when the recruiter was rejected, if any.",
      example: "The company name could not be matched.",
    }),
    companyName: z.string().nullable().meta({
      description: "Recruiter company name. Null for other roles or when none is set.",
      example: "Acme Recruitment",
    }),
    jobTitle: z.string().nullable().meta({
      description: "Recruiter job title. Null for other roles or when none is set.",
      example: "Talent Acquisition Lead",
    }),
    approvedAt: z.string().datetime().nullable().meta({
      description: "When the recruiter was first approved. Null when never approved.",
      example: "2026-01-02T00:00:00.000Z",
    }),
    listingCount: z.number().int().min(0).nullable().meta({
      description: "Listings the recruiter owns, any status. Null for non-recruiters.",
      example: 5,
    }),
    openListingCount: z.number().int().min(0).nullable().meta({
      description: "Open listings the recruiter owns. Null for non-recruiters.",
      example: 2,
    }),
    applicationCount: z.number().int().min(0).nullable().meta({
      description: "Applications the applicant has submitted. Null for non-applicants.",
      example: 3,
    }),
    resumeState: z.enum(ADMIN_USER_RESUME_STATES).nullable().meta({
      description: "Applicant resume processing state, never its content. Null for non-applicants.",
      example: "ready",
    }),
  })
  .meta({
    id: "AdminUserDetail",
    description: "A user for the admin drawer. Counts and states only, never private content.",
  });

export type AdminUserDetailResponse = z.infer<typeof adminUserDetailResponseSchema>;

export const adminUserListResponseSchema = z
  .object({
    items: z.array(adminUserResponseSchema).meta({ description: "Users on this page." }),
    total: z
      .number()
      .int()
      .min(0)
      .meta({ description: "Users matching the filters.", example: 42 }),
    page: z.number().int().min(1).meta({ description: "Current page.", example: 1 }),
    pageSize: z.number().int().meta({
      description: "Users per page.",
      example: ADMIN_USER_PAGE_SIZE,
    }),
  })
  .meta({ id: "AdminUserList", description: "A page of user accounts." });

export type AdminUserListResponse = z.infer<typeof adminUserListResponseSchema>;

export const adminUserResultResponseSchema = z
  .object({
    id: z.string().uuid().meta({
      description: "Profile ID.",
      example: "9d2c4f6a-1b3e-4a85-8c07-6e5d4c3b2a19",
    }),
    accountStatus: z.enum(ACCOUNT_STATUSES).meta({
      description: "Account status after the change.",
      example: "suspended",
    }),
  })
  .meta({ id: "AdminUserResult", description: "The user account that was changed." });

export type AdminUserResultResponse = z.infer<typeof adminUserResultResponseSchema>;
