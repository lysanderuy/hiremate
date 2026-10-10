import { HttpError } from "@/lib/api/errors";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { PDF_MAX_BYTES, PDF_SIZE_ERROR, PDF_TYPE_ERROR } from "@/lib/resume/client-file";
import { readResumePdf } from "@/lib/resume/read-resume-pdf";
import { resumeService } from "@/services/resume.service";

const MULTIPART_OVERHEAD_BYTES = 64 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const declaredLength = Number(request.headers.get("content-length"));
    if (declaredLength > PDF_MAX_BYTES + MULTIPART_OVERHEAD_BYTES) {
      throw new HttpError(PDF_SIZE_ERROR, 422);
    }

    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw new HttpError(PDF_TYPE_ERROR, 422);

    const text = await readResumePdf(file);
    return apiSuccess(await resumeService.saveMine(auth.user.id, { text, source: "pdf" }));
  } catch (error) {
    return handleApiError(error);
  }
}
