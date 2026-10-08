import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { listingService } from "@/services/listing.service";
import { createListingSchema } from "@/validators/listing.validator";

export async function GET() {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    return apiSuccess(await listingService.list(auth.user.id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const input = createListingSchema.parse(await request.json());
    return apiSuccess(await listingService.create(auth.user.id, input), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
