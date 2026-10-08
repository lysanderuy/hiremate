import { ArrowLeft } from "lucide-react";

import { ListingForm } from "@/components/listings/listing-form";
import { DiscardGuardLink } from "@/components/shared/discard-guard-link";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function NewListingPage() {
  await requireActiveRecruiter();

  return (
    <div className="space-y-6">
      <DiscardGuardLink
        href="/dashboard/recruiter/listings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
      >
        <ArrowLeft className="size-4" />
        Listings
      </DiscardGuardLink>
      <h1 className="text-2xl font-bold tracking-tight text-navy">Post a listing</h1>
      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <ListingForm mode="create" />
      </div>
    </div>
  );
}
