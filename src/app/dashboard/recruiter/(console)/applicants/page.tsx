import { Suspense } from "react";

import { ApplicantsView } from "@/components/applicants/applicants-view";
import { PageHeader } from "@/components/shared/page-header";
import { requireActiveRecruiter } from "@/lib/auth/require-role";
import { listingIdSchema } from "@/validators/listing.validator";

type RecruiterApplicantsPageProps = {
  searchParams: Promise<{ listing?: string }>;
};

export default async function RecruiterApplicantsPage({
  searchParams,
}: RecruiterApplicantsPageProps) {
  await requireActiveRecruiter();
  const { listing } = await searchParams;
  const parsed = listingIdSchema.safeParse(listing);

  return (
    <div>
      <PageHeader
        title="Applicants"
        description="Ranked by how well each resume fits the listing."
      />
      <Suspense fallback={null}>
        <ApplicantsView initialListingId={parsed.success ? parsed.data : undefined} />
      </Suspense>
    </div>
  );
}
