import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CandidateDetail } from "@/components/candidates/candidate-detail";
import { requireActiveRecruiter } from "@/lib/auth/require-role";
import { applicationIdSchema } from "@/validators/application.validator";

export default async function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveRecruiter();
  const { id } = await params;
  if (!applicationIdSchema.safeParse(id).success) notFound();

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <CandidateDetail id={id} />
      </Suspense>
    </div>
  );
}
