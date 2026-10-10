import { notFound } from "next/navigation";

import { JobDetail } from "@/components/jobs/job-detail";
import { requireRole } from "@/lib/auth/require-role";
import { openListingIdSchema } from "@/validators/open-listing.validator";

export default async function ApplicantJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("applicant");
  const { id } = await params;
  if (!openListingIdSchema.safeParse(id).success) notFound();

  return <JobDetail id={id} />;
}
