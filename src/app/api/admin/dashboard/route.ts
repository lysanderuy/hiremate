import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { adminDashboardService } from "@/services/admin-dashboard.service";

export async function GET() {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    return apiSuccess(await adminDashboardService.get());
  } catch (error) {
    return handleApiError(error);
  }
}
