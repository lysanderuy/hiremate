import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { listingService } from "@/services/listing.service";
import { listingIdSchema } from "@/validators/listing.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;
    const id = listingIdSchema.parse((await params).id);
    return apiSuccess(await listingService.prepareById(auth.user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}
