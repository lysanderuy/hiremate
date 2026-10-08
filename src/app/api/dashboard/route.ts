import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { dashboardService } from "@/services/dashboard.service";

export async function GET() {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    return apiSuccess(await dashboardService.get(auth.user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
