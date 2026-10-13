import { pdfResponse } from "@/lib/api/pdf-response";
import { handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { resumeService } from "@/services/resume.service";

export async function GET() {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const file = await resumeService.getMyFile(auth.user.id);
    return pdfResponse(file.data, file.fileName);
  } catch (error) {
    return handleApiError(error);
  }
}
