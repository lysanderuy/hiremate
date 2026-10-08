import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { applicationService } from "@/services/application.service";
import { listApplicationsQuerySchema } from "@/validators/application.validator";
import { listingIdSchema } from "@/validators/listing.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const id = listingIdSchema.parse((await params).id);
    const { searchParams } = new URL(request.url);
    const query = listApplicationsQuerySchema.parse(Object.fromEntries(searchParams));
    return apiSuccess(await applicationService.listForListing(auth.user.id, id, query));
  } catch (error) {
    return handleApiError(error);
  }
}
