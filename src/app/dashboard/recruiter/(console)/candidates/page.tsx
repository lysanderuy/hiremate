import { Suspense } from "react";

import { CandidatesView } from "@/components/candidates/candidates-view";
import { requireActiveRecruiter } from "@/lib/auth/require-role";
import { listingIdSchema } from "@/validators/listing.validator";

type RecruiterCandidatesPageProps = {
  searchParams: Promise<{ listing?: string }>;
};

export default async function RecruiterCandidatesPage({
  searchParams,
}: RecruiterCandidatesPageProps) {
  await requireActiveRecruiter();
  const { listing } = await searchParams;
  const parsed = listingIdSchema.safeParse(listing);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-navy">Candidates</h1>
        <p className="text-sm text-muted-foreground">
          Review and rank applicants for each listing.
        </p>
      </div>
      <Suspense fallback={null}>
        <CandidatesView initialListingId={parsed.success ? parsed.data : undefined} />
      </Suspense>
    </div>
  );
}
