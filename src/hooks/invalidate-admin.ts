import type { QueryClient } from "@tanstack/react-query";

import { adminDashboardKeys } from "./use-admin-dashboard";
import { adminListingKeys } from "./use-admin-listings";
import { adminUserKeys } from "./use-admin-users";
import { approvalKeys } from "./use-approvals";

export function invalidateAdmin(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: adminDashboardKeys.all });
  queryClient.invalidateQueries({ queryKey: approvalKeys.all });
  queryClient.invalidateQueries({ queryKey: adminUserKeys.all });
  queryClient.invalidateQueries({ queryKey: adminListingKeys.all });
}
