"use client";

import { ListingForm } from "@/components/listings/listing-form";
import { useListing } from "@/hooks/use-listing";
import { ApiError } from "@/lib/api/client";

export function ListingEdit({ id }: { id: string }) {
  const { data, isPending, error } = useListing(id);

  if (isPending) return <p className="text-muted-foreground">Loading listing...</p>;

  if (error instanceof ApiError && error.status === 404) {
    return <p className="text-muted-foreground">Listing not found.</p>;
  }

  if (error || !data) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error?.message ?? "Listing not found."}
      </p>
    );
  }

  return <ListingForm mode="edit" listing={data} />;
}
