import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { resumeService } from "@/services/resume.service";

export async function POST() {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    return apiSuccess(await resumeService.reprocessMine(auth.user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
