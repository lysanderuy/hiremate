import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { listingService } from "@/services/listing.service";
import { listingIdSchema, updateListingSchema } from "@/validators/listing.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const id = listingIdSchema.parse((await params).id);
    return apiSuccess(await listingService.getById(auth.user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const id = listingIdSchema.parse((await params).id);
    const input = updateListingSchema.parse(await request.json());
    return apiSuccess(await listingService.update(auth.user.id, id, input));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const id = listingIdSchema.parse((await params).id);
    return apiSuccess(await listingService.remove(auth.user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}
