import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { openListingService } from "@/services/open-listing.service";
import { listOpenListingsQuerySchema } from "@/validators/open-listing.validator";

export async function GET(request: Request) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const query = listOpenListingsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return apiSuccess(await openListingService.list(auth.user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}
