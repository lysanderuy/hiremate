import { handleApiError } from "@/lib/api/response";
import { authenticateAdmin } from "@/lib/auth/api-auth";
import { csvResponse } from "@/lib/csv/csv-response";
import { csvFileName, toCsv } from "@/lib/csv/to-csv";
import { adminExportService } from "@/services/admin-export.service";

export async function GET() {
  try {
    const auth = await authenticateAdmin();
    if (!auth.ok) return auth.response;

    const { headers, rows } = await adminExportService.applications();
    return csvResponse(toCsv(headers, rows), csvFileName("applications"));
  } catch (error) {
    return handleApiError(error);
  }
}
