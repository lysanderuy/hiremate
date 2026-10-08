import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ApplicantDetail } from "@/components/applicants/applicant-detail";
import { requireActiveRecruiter } from "@/lib/auth/require-role";
import { applicationIdSchema } from "@/validators/application.validator";

export default async function ApplicantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveRecruiter();
  const { id } = await params;
  if (!applicationIdSchema.safeParse(id).success) notFound();

  return (
    <Suspense fallback={null}>
      <ApplicantDetail id={id} />
    </Suspense>
  );
}
