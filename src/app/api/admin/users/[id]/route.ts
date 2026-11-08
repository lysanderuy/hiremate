import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { adminUserService } from "@/services/admin-user.service";
import { adminUserIdSchema } from "@/validators/admin-user.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    const id = adminUserIdSchema.parse((await params).id);
    return apiSuccess(await adminUserService.getById(id));
  } catch (error) {
    return handleApiError(error);
  }
}
