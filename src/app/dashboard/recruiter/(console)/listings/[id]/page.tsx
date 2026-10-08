import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { ListingDetail } from "@/components/listings/listing-detail";
import { CRUMB_CLASS } from "@/components/shared/page-header";
import { requireActiveRecruiter } from "@/lib/auth/require-role";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireActiveRecruiter();
  const { id } = await params;

  return (
    <div>
      <Link href="/dashboard/recruiter/listings" className={CRUMB_CLASS}>
        <ArrowLeft className="size-4.5" aria-hidden="true" />
        Listings
      </Link>
      <ListingDetail id={id} />
    </div>
  );
}
