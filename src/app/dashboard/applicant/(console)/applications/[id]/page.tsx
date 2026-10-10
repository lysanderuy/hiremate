import { notFound } from "next/navigation";

import { ApplicationDetail } from "@/components/my-applications/application-detail";
import { requireRole } from "@/lib/auth/require-role";
import { applicationIdSchema } from "@/validators/application.validator";

export default async function ApplicantApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("applicant");
  const { id } = await params;
  if (!applicationIdSchema.safeParse(id).success) notFound();

  return <ApplicationDetail id={id} />;
}
