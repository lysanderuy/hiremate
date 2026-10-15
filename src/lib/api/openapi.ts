import { z } from "zod";
import { createDocument } from "zod-openapi";
import {
  applicationDetailResponseSchema,
  applicationIdSchema,
  applicationListResponseSchema,
  applyToListingSchema,
  listApplicationsQuerySchema,
  listMyApplicationsQuerySchema,
  myApplicationDetailResponseSchema,
  myApplicationListResponseSchema,
  updateApplicationStatusSchema,
} from "@/validators/application.validator";
import { companyResponseSchema, updateCompanySchema } from "@/validators/company.validator";
import {
  applicantDashboardResponseSchema,
  dashboardResponseSchema,
} from "@/validators/dashboard.validator";
import {
  createListingSchema,
  listingIdResponseSchema,
  listingIdSchema,
  listingResponseSchema,
  updateListingSchema,
} from "@/validators/listing.validator";
import {
  listOpenListingsQuerySchema,
  openListingDetailResponseSchema,
  openListingIdSchema,
  openListingListResponseSchema,
} from "@/validators/open-listing.validator";
import { profileResponseSchema, updateProfileSchema } from "@/validators/profile.validator";
import { resumeResponseSchema } from "@/validators/resume.validator";
import {
  listSkillsQuerySchema,
  skillResponseSchema,
  suggestSkillsSchema,
} from "@/validators/skill.validator";

function successEnvelope<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    success: z.literal(true),
    data: dataSchema,
  });
}

const errorEnvelope = z.object({
  success: z.literal(false),
  error: z.string().meta({ example: "Unauthorized" }),
});

function errorResponse(description: string) {
  return {
    description,
    content: {
      "application/json": { schema: errorEnvelope },
    },
  };
}

function successResponse<T extends z.ZodType>(description: string, dataSchema: T) {
  return {
    description,
    content: {
      "application/json": { schema: successEnvelope(dataSchema) },
    },
  };
}

const listingIdParams = z.object({
  id: listingIdSchema.meta({
    description: "Listing ID.",
    example: "7c1f2b0a-5d4e-4a63-9b8c-1e2d3f4a5b6c",
  }),
});

const applicationIdParams = z.object({ id: applicationIdSchema });

const openListingIdParams = z.object({ id: openListingIdSchema });

const pdfResponse = {
  description: "The resume PDF, served inline as raw bytes instead of the JSON envelope.",
  content: {
    "application/pdf": { schema: z.string().meta({ format: "binary" }) },
  },
};

const NOT_APPLICANT = "Account is not an approved applicant.";

export const openApiDocument = createDocument({
  openapi: "3.1.0",
  info: {
    title: "Hiremate API",
    version: "1.0.0",
  },
  paths: {
    "/api/profile": {
      get: {
        summary: "Get the authenticated user's profile",
        responses: {
          "200": {
            description: "Profile retrieved successfully.",
            content: {
              "application/json": { schema: successEnvelope(profileResponseSchema) },
            },
          },
          "401": {
            description: "Unauthorized.",
            content: {
              "application/json": { schema: errorEnvelope },
            },
          },
          "404": {
            description: "Profile not found.",
            content: {
              "application/json": { schema: errorEnvelope },
            },
          },
        },
      },
      patch: {
        summary: "Update the authenticated user's profile",
        requestBody: {
          content: {
            "application/json": { schema: updateProfileSchema },
          },
        },
        responses: {
          "200": {
            description: "Profile updated successfully.",
            content: {
              "application/json": { schema: successEnvelope(profileResponseSchema) },
            },
          },
          "401": {
            description: "Unauthorized.",
            content: {
              "application/json": { schema: errorEnvelope },
            },
          },
          "404": {
            description: "Profile not found.",
            content: {
              "application/json": { schema: errorEnvelope },
            },
          },
          "422": {
            description: "Validation error.",
            content: {
              "application/json": { schema: errorEnvelope },
            },
          },
        },
      },
    },
    "/api/listings": {
      get: {
        summary: "List the authenticated recruiter's listings, newest first",
        responses: {
          "200": successResponse(
            "Listings retrieved successfully.",
            z.array(listingResponseSchema),
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
        },
      },
      post: {
        summary: "Create a listing",
        requestBody: {
          content: {
            "application/json": { schema: createListingSchema },
          },
        },
        responses: {
          "201": successResponse("Listing created successfully.", listingResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "409": errorResponse("The recruiter has not added a company name yet."),
          "422": errorResponse("Validation error, or a skill is not in the skills list."),
        },
      },
    },
    "/api/listings/{id}": {
      get: {
        summary: "Get one of the authenticated recruiter's listings",
        requestParams: { path: listingIdParams },
        responses: {
          "200": successResponse("Listing retrieved successfully.", listingResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "404": errorResponse("Listing not found."),
          "422": errorResponse("Validation error."),
        },
      },
      patch: {
        summary: "Update a listing, or close or reopen it",
        requestParams: { path: listingIdParams },
        requestBody: {
          content: {
            "application/json": { schema: updateListingSchema },
          },
        },
        responses: {
          "200": successResponse("Listing updated successfully.", listingResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter, or the listing was removed."),
          "404": errorResponse("Listing not found."),
          "422": errorResponse("Validation error, or a skill is not in the skills list."),
        },
      },
      delete: {
        summary: "Delete a listing that has no applications",
        requestParams: { path: listingIdParams },
        responses: {
          "200": successResponse("Listing deleted successfully.", listingIdResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter, or the listing was removed."),
          "404": errorResponse("Listing not found."),
          "409": errorResponse("The listing has applications and can only be closed."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/listings/{id}/prepare": {
      post: {
        summary: "Compute the listing's match embedding if it is missing",
        requestParams: { path: listingIdParams },
        responses: {
          "200": successResponse("Listing is match ready.", listingResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter, or the listing was removed."),
          "404": errorResponse("Listing not found."),
          "422": errorResponse("Validation error."),
          "429": errorResponse(
            "A recent attempt is still cooling down. Retry in about 30 seconds.",
          ),
          "503": errorResponse("The matching service is unavailable."),
        },
      },
    },
    "/api/listings/{id}/applications": {
      get: {
        summary: "List applications to one of the authenticated recruiter's listings",
        requestParams: { path: listingIdParams, query: listApplicationsQuerySchema },
        responses: {
          "200": successResponse(
            "Applications retrieved successfully.",
            applicationListResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "404": errorResponse("Listing not found."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/dashboard": {
      get: {
        summary: "Get the authenticated recruiter's dashboard summary",
        responses: {
          "200": successResponse("Dashboard retrieved successfully.", dashboardResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
        },
      },
    },
    "/api/applications/{id}": {
      get: {
        summary: "Get one application. A submitted application is marked as viewed.",
        requestParams: { path: applicationIdParams },
        responses: {
          "200": successResponse(
            "Application retrieved successfully.",
            applicationDetailResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "404": errorResponse("Application not found."),
          "422": errorResponse("Validation error."),
        },
      },
      patch: {
        summary: "Set the status of an application",
        requestParams: { path: applicationIdParams },
        requestBody: {
          content: {
            "application/json": { schema: updateApplicationStatusSchema },
          },
        },
        responses: {
          "200": successResponse(
            "Application updated successfully.",
            applicationDetailResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "404": errorResponse("Application not found."),
          "409": errorResponse("The applicant withdrew this application."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/resumes/me": {
      get: {
        summary: "Get the applicant's resume",
        responses: {
          "200": successResponse(
            "Resume retrieved successfully. Data is null when none exists.",
            resumeResponseSchema.nullable(),
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
        },
      },
    },
    "/api/resumes/me/reprocess": {
      post: {
        summary: "Re-run skill extraction and embedding on the stored resume text",
        responses: {
          "200": successResponse("Resume reprocessed successfully.", resumeResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "404": errorResponse("Resume not found."),
          "429": errorResponse(
            "A recent attempt is still cooling down. Retry in about 30 seconds.",
          ),
        },
      },
    },
    "/api/resumes/me/pdf": {
      post: {
        summary:
          "Upload a text-based PDF resume, replacing any existing one. The original PDF is stored and can be opened from the file endpoints. Extracted text is used internally and is never returned.",
        requestBody: {
          content: {
            "multipart/form-data": {
              schema: z.object({
                file: z
                  .string()
                  .meta({ description: "PDF file, up to 4 MB and 30 pages.", format: "binary" }),
              }),
            },
          },
        },
        responses: {
          "200": successResponse("Resume saved successfully.", resumeResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "411": errorResponse("Content-Length header is missing."),
          "413": errorResponse("File is larger than 4 MB."),
          "422": errorResponse("Not a PDF, or no readable text."),
        },
      },
    },
    "/api/resumes/me/file": {
      get: {
        summary: "Open the applicant's resume PDF",
        responses: {
          "200": pdfResponse,
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "404": errorResponse("No resume file on record."),
        },
      },
    },
    "/api/applications/me/{id}/file": {
      get: {
        summary: "Open the PDF the applicant sent with an application",
        requestParams: { path: applicationIdParams },
        responses: {
          "200": pdfResponse,
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "404": errorResponse("Application or resume file not found."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/applications/{id}/file": {
      get: {
        summary: "Open the PDF an applicant sent with an application",
        requestParams: { path: applicationIdParams },
        responses: {
          "200": pdfResponse,
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "404": errorResponse("Application or resume file not found."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/listings/open": {
      get: {
        summary: "Browse open listings, with the applicant's match and application for each",
        requestParams: { query: listOpenListingsQuerySchema },
        responses: {
          "200": successResponse("Listings retrieved successfully.", openListingListResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/listings/open/{id}": {
      get: {
        summary: "Get one open listing, with the applicant's match and application",
        requestParams: { path: openListingIdParams },
        responses: {
          "200": successResponse(
            "Listing retrieved successfully.",
            openListingDetailResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "404": errorResponse("Listing not found, or not open."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/applications": {
      post: {
        summary: "Apply to an open listing using the saved resume",
        requestBody: {
          content: {
            "application/json": { schema: applyToListingSchema },
          },
        },
        responses: {
          "201": successResponse(
            "Application submitted successfully.",
            myApplicationDetailResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "404": errorResponse("Listing not found."),
          "409": errorResponse(
            "Conflict. Returned when the listing is no longer open, the applicant has no saved resume, the saved resume is not ready, the listing is still being prepared for matching, or the applicant already has an active (submitted, viewed, shortlisted or interview) or rejected application for this listing. An applicant who withdrew can apply again while the listing is open.",
          ),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/applications/me": {
      get: {
        summary: "List the applicant's applications, newest first",
        requestParams: { query: listMyApplicationsQuerySchema },
        responses: {
          "200": successResponse(
            "Applications retrieved successfully.",
            myApplicationListResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/applications/me/{id}": {
      get: {
        summary: "Get one of the applicant's applications",
        requestParams: { path: applicationIdParams },
        responses: {
          "200": successResponse(
            "Application retrieved successfully.",
            myApplicationDetailResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "404": errorResponse("Application not found."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/applications/me/{id}/withdraw": {
      post: {
        summary: "Withdraw one of the applicant's applications",
        description:
          "The withdrawn application is kept as history. The applicant can apply to the same listing again while it is open.",
        requestParams: { path: applicationIdParams },
        responses: {
          "200": successResponse(
            "Application withdrawn successfully.",
            myApplicationDetailResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
          "404": errorResponse("Application not found."),
          "409": errorResponse(
            "Conflict. The application can no longer be withdrawn because it was rejected or is already withdrawn.",
          ),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/dashboard/applicant": {
      get: {
        summary: "Get the authenticated applicant's dashboard summary",
        responses: {
          "200": successResponse(
            "Dashboard retrieved successfully.",
            applicantDashboardResponseSchema,
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse(NOT_APPLICANT),
        },
      },
    },
    "/api/company": {
      get: {
        summary: "Get the recruiter's company",
        responses: {
          "200": successResponse(
            "Company retrieved successfully. Data is null when none exists.",
            companyResponseSchema.nullable(),
          ),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
        },
      },
      patch: {
        summary: "Set the recruiter's company name, creating the company if needed",
        requestBody: {
          content: {
            "application/json": { schema: updateCompanySchema },
          },
        },
        responses: {
          "200": successResponse("Company updated successfully.", companyResponseSchema),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/skills": {
      get: {
        summary: "Search active skills by name",
        requestParams: { query: listSkillsQuerySchema },
        responses: {
          "200": successResponse("Skills retrieved successfully.", z.array(skillResponseSchema)),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "422": errorResponse("Validation error."),
        },
      },
    },
    "/api/skills/suggest": {
      post: {
        summary: "Suggest skills found in a listing title and description",
        requestBody: {
          content: {
            "application/json": { schema: suggestSkillsSchema },
          },
        },
        responses: {
          "200": successResponse("Skills suggested successfully.", z.array(skillResponseSchema)),
          "401": errorResponse("Unauthorized."),
          "403": errorResponse("Account is not an approved recruiter."),
          "422": errorResponse("Validation error."),
        },
      },
    },
  },
});
