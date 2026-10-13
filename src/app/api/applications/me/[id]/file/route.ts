import { handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { applicationService } from "@/services/application.service";
import { applicationIdSchema } from "@/validators/application.validator";

type RouteContext = { params: Promise<{ id: string }> };

const PDF_HEADERS = {
  "Content-Type": "application/pdf",
  "Content-Disposition": 'inline; filename="resume.pdf"',
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const id = applicationIdSchema.parse((await params).id);
    const file = await applicationService.getMyFile(auth.user.id, id);
    return new Response(new Uint8Array(file), { headers: PDF_HEADERS });
  } catch (error) {
    return handleApiError(error);
  }
}
