import { HttpError } from "@/lib/api/errors";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import {
  PDF_SIZE_ERROR,
  PDF_TYPE_ERROR,
  UPLOAD_LENGTH_REQUIRED_ERROR,
  checkUploadLength,
} from "@/lib/resume/client-file";
import { readResumePdf } from "@/lib/resume/read-resume-pdf";
import { resumeService } from "@/services/resume.service";

export async function POST(request: Request) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const lengthStatus = checkUploadLength(request.headers.get("content-length"));
    if (lengthStatus === 411) throw new HttpError(UPLOAD_LENGTH_REQUIRED_ERROR, 411);
    if (lengthStatus === 413) throw new HttpError(PDF_SIZE_ERROR, 413);

    const file = (await request.formData()).get("file");
    if (!(file instanceof File)) throw new HttpError(PDF_TYPE_ERROR, 422);

    const { text, bytes, fileName } = await readResumePdf(file);
    return apiSuccess(
      await resumeService.saveMine(auth.user.id, { text, source: "pdf", file: bytes, fileName }),
    );
  } catch (error) {
    return handleApiError(error);
  }
}
