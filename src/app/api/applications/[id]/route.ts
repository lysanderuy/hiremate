import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { applicationService } from "@/services/application.service";
import {
  applicationIdSchema,
  updateApplicationStatusSchema,
} from "@/validators/application.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const id = applicationIdSchema.parse((await params).id);
    return apiSuccess(await applicationService.getById(auth.user.id, id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const id = applicationIdSchema.parse((await params).id);
    const { status } = updateApplicationStatusSchema.parse(await request.json());
    return apiSuccess(await applicationService.updateStatus(auth.user.id, id, status));
  } catch (error) {
    return handleApiError(error);
  }
}
