import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { applicationService } from "@/services/application.service";
import { applyToListingSchema } from "@/validators/application.validator";

export async function POST(request: Request) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const input = applyToListingSchema.parse(await request.json());
    return apiSuccess(await applicationService.apply(auth.user.id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
