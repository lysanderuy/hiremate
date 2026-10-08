import { ArrowLeft } from "lucide-react";

import { ListingEdit } from "@/components/listings/listing-edit";
import { DiscardGuardLink } from "@/components/shared/discard-guard-link";
import { CRUMB_CLASS, PageHeader } from "@/components/shared/page-header";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveRecruiter();
  const { id } = await params;

  return (
    <div>
      <DiscardGuardLink href="/dashboard/recruiter/listings" className={CRUMB_CLASS}>
        <ArrowLeft className="size-4.5" aria-hidden="true" />
        Listings
      </DiscardGuardLink>
      <PageHeader title="Edit listing" description="Update the details applicants see." />
      <ListingEdit id={id} />
    </div>
  );
}
