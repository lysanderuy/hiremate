import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { adminListingService } from "@/services/admin-listing.service";
import { adminListingIdSchema, removeListingSchema } from "@/validators/admin-listing.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    const id = adminListingIdSchema.parse((await params).id);
    const { reason } = removeListingSchema.parse(await request.json());
    return apiSuccess(await adminListingService.remove(id, reason));
  } catch (error) {
    return handleApiError(error);
  }
}
