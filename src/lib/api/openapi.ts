import { z } from "zod";
import { createDocument } from "zod-openapi";
import {
  applicationDetailResponseSchema,
  applicationIdSchema,
  applicationListResponseSchema,
  listApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from "@/validators/application.validator";
import { companyResponseSchema, updateCompanySchema } from "@/validators/company.validator";
import {
  createListingSchema,
  listingIdResponseSchema,
  listingIdSchema,
  listingResponseSchema,
  updateListingSchema,
} from "@/validators/listing.validator";
import { profileResponseSchema, updateProfileSchema } from "@/validators/profile.validator";
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
