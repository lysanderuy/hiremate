import { pdfResponse } from "@/lib/api/pdf-response";
import { handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { applicationService } from "@/services/application.service";
import { applicationIdSchema } from "@/validators/application.validator";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const id = applicationIdSchema.parse((await params).id);
    const file = await applicationService.getMyFile(auth.user.id, id);
    return pdfResponse(file.data, file.fileName);
  } catch (error) {
    return handleApiError(error);
  }
}
