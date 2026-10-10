import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { dashboardService } from "@/services/dashboard.service";

export async function GET() {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    return apiSuccess(await dashboardService.getApplicant(auth.user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
