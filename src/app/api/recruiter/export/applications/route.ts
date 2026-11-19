import { handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { csvResponse } from "@/lib/csv/csv-response";
import { csvFileName, toCsv } from "@/lib/csv/to-csv";
import { recruiterExportService } from "@/services/recruiter-export.service";

export async function GET() {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const { headers, rows } = await recruiterExportService.applications(auth.user.id);
    return csvResponse(toCsv(headers, rows), csvFileName("recruiter-applications"));
  } catch (error) {
    return handleApiError(error);
  }
}
