import { ListingsView } from "@/components/admin/listings-view";
import { PageHeader } from "@/components/shared/page-header";
import { requireRole } from "@/lib/auth/require-role";

type PageProps = {
  searchParams: Promise<{ filter?: string }>;
};

export default async function AdministratorListingsPage({ searchParams }: PageProps) {
  await requireRole("administrator");
  const { filter } = await searchParams;
  const initialFilter = filter === "empty" || filter === "preparing" ? filter : undefined;

  return (
    <div>
      <PageHeader title="Listings" description="Moderate listings across all statuses." />
      <ListingsView key={initialFilter ?? "all"} initialFilter={initialFilter} />
    </div>
  );
}
