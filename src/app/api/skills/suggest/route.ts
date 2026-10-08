import { apiSuccess, handleApiError } from "@/lib/api/response";
import { authenticateActiveRecruiter } from "@/lib/auth/api-auth";
import { skillService } from "@/services/skill.service";
import { suggestSkillsSchema } from "@/validators/skill.validator";

export async function POST(request: Request) {
  try {
    const auth = await authenticateActiveRecruiter();
    if (!auth.ok) return auth.response;

    const input = suggestSkillsSchema.parse(await request.json());
    return apiSuccess(await skillService.suggest(input));
  } catch (error) {
    return handleApiError(error);
  }
}
