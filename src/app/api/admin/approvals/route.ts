import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { approvalService } from "@/services/approval.service";

export async function GET() {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    return apiSuccess(await approvalService.listPending());
  } catch (error) {
    return handleApiError(error);
  }
}
