import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { adminListingService } from "@/services/admin-listing.service";
import { adminListingIdSchema } from "@/validators/admin-listing.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    const id = adminListingIdSchema.parse((await params).id);
    return apiSuccess(await adminListingService.restore(id));
  } catch (error) {
    return handleApiError(error);
  }
}
