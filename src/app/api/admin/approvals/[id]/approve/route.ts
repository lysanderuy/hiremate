import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { approvalService } from "@/services/approval.service";
import { approvalIdSchema } from "@/validators/approval.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    const id = approvalIdSchema.parse((await params).id);
    return apiSuccess(await approvalService.approve(id));
  } catch (error) {
    return handleApiError(error);
  }
}
