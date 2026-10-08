import { ListingForm } from "@/components/listings/listing-form";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function NewListingPage() {
  await requireActiveRecruiter();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Post a listing</h1>
      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <ListingForm mode="create" />
      </div>
    </div>
  );
}
