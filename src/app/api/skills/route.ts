import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { skillService } from "@/services/skill.service";
import { listSkillsQuerySchema } from "@/validators/skill.validator";

export async function GET(request: Request) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(request.url);
    const query = listSkillsQuerySchema.parse(Object.fromEntries(searchParams));
    return apiSuccess(await skillService.listActive(query));
  } catch (error) {
    return handleApiError(error);
  }
}
