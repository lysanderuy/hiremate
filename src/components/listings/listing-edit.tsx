"use client";

import { ListingForm } from "@/components/listings/listing-form";
import { useListing } from "@/hooks/use-listing";
import { ApiError } from "@/lib/api/client";

export function ListingEdit({ id }: { id: string }) {
  const { data, isPending, error } = useListing(id);

  if (isPending) return <p className="text-sm text-muted-foreground">Loading listing...</p>;

  if (error instanceof ApiError && error.status === 404) {
    return <p className="text-sm text-muted-foreground">Listing not found.</p>;
  }

  if (error || !data) {
    return (
      <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
        {error?.message ?? "Listing not found."}
      </p>
    );
  }

  return <ListingForm mode="edit" listing={data} />;
}
