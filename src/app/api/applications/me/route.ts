import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateApplicant } from "@/lib/auth/api-auth";
import { applicationService } from "@/services/application.service";
import { listMyApplicationsQuerySchema } from "@/validators/application.validator";

export async function GET(request: Request) {
  try {
    const auth = await authenticateApplicant();
    if (!auth.ok) return auth.response;

    const query = listMyApplicationsQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return apiSuccess(await applicationService.listMine(auth.user.id, query));
  } catch (error) {
    return handleApiError(error);
  }
}
