import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { openListingService } from "@/services/open-listing.service";
import { openListingIdSchema } from "@/validators/open-listing.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const id = openListingIdSchema.parse((await params).id);
    return apiSuccess(await openListingService.getById(auth.user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}
