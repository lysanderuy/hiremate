import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { adminUserService } from "@/services/admin-user.service";
import { listAdminUsersQuerySchema } from "@/validators/admin-user.validator";

export async function GET(request: Request) {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    const query = listAdminUsersQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return apiSuccess(await adminUserService.list(query));
  } catch (error) {
    return handleApiError(error);
  }
}
