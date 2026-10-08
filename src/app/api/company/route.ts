import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { companyService } from "@/services/company.service";
import { updateCompanySchema } from "@/validators/company.validator";

export async function GET() {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const company = await companyService.getByOwner(auth.user.id);
    return apiSuccess(company ?? null);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const input = updateCompanySchema.parse(await request.json());
    return apiSuccess(await companyService.setName(auth.user.id, input.name));
  } catch (error) {
    return handleApiError(error);
  }
}
