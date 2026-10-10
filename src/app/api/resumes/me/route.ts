import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { resumeService } from "@/services/resume.service";
import { saveResumeSchema } from "@/validators/resume.validator";

export async function GET() {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    return apiSuccess(await resumeService.getMine(auth.user.id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const input = saveResumeSchema.parse(await request.json());
    return apiSuccess(await resumeService.saveMine(auth.user.id, input));
  } catch (error) {
    return handleApiError(error);
  }
}
