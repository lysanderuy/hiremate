import { handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { resumeService } from "@/services/resume.service";

const PDF_HEADERS = {
  "Content-Type": "application/pdf",
  "Content-Disposition": 'inline; filename="resume.pdf"',
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const file = await resumeService.getMyFile(auth.user.id);
    return new Response(new Uint8Array(file), { headers: PDF_HEADERS });
  } catch (error) {
    return handleApiError(error);
  }
}
