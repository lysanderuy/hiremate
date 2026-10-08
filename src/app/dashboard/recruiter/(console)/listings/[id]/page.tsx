import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ListingDetail } from "@/components/listings/listing-detail";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveRecruiter();
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/recruiter/listings"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-navy"
      >
        <ArrowLeft className="size-4" />
        Listings
      </Link>
      <ListingDetail id={id} />
    </div>
  );
}
