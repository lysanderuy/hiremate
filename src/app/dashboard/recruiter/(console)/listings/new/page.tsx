import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/listings/listing-form";
import { DiscardGuardLink } from "@/components/shared/discard-guard-link";
import { CRUMB_CLASS, PageHeader } from "@/components/shared/page-header";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function NewListingPage() {
  await requireActiveRecruiter();

  return (
    <div>
      <DiscardGuardLink href="/dashboard/recruiter/listings" className={CRUMB_CLASS}>
        <ArrowLeft className="size-4.5" aria-hidden="true" />
        Listings
      </DiscardGuardLink>
      <PageHeader
        title="Create job listing"
        description="Applicants see these details before they apply."
      />
      <ListingForm mode="create" />
    </div>
  );
}
