import { ListingEdit } from "@/components/listings/listing-edit";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveRecruiter();
  const { id } = await params;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-navy">Edit listing</h1>
      <div className="rounded-xl border border-border bg-white p-4 sm:p-6">
        <ListingEdit id={id} />
      </div>
    </div>
  );
}
