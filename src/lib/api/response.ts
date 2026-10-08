import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { HttpError } from "@/lib/api/errors";
import type { ApiResponse } from "@/types/api";

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ success: true, data }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json<ApiResponse<never>>({ success: false, error }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join(".") || "body"}: ${issue.message}`)
      .join("; ");
    return apiError(message, 422);
  }

  if (error instanceof HttpError) {
    return apiError(error.message, error.status);
  }

  // request.json() throws SyntaxError on a malformed body.
  if (error instanceof SyntaxError) {
    return apiError("Invalid JSON body", 400);
  }

  console.error("[api]", error);
  return apiError("Internal server error", 500);
}
