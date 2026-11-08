import { apiError, apiSuccess, handleApiError } from "@/lib/api/response";
import { createClient } from "@/lib/supabase/server";
import { approvalService } from "@/services/approval.service";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return apiError("Unauthorized", 401);

    return apiSuccess(await approvalService.requestReview(user.id));
  } catch (error) {
    return handleApiError(error);
  }
}
