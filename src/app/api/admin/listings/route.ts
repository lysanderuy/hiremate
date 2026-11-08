import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { adminListingService } from "@/services/admin-listing.service";
import { listAdminListingsQuerySchema } from "@/validators/admin-listing.validator";

export async function GET(request: Request) {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    const query = listAdminListingsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return apiSuccess(await adminListingService.list(query));
  } catch (error) {
    return handleApiError(error);
  }
}
