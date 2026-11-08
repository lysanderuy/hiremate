"use client";

import { Briefcase, LayoutDashboard, UserCheck, Users } from "lucide-react";

import { AppSidebar, AppTopBar, type NavItem } from "@/components/shared/app-sidebar";
import { useApprovals } from "@/hooks/use-approvals";
import { useProfile } from "@/hooks/use-profile";

const BASE = "/dashboard/administrator";

const APPROVALS_HREF = `${BASE}/approvals`;

const NAV_ITEMS: NavItem[] = [
  { href: BASE, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: APPROVALS_HREF, label: "Approvals", icon: UserCheck },
  { href: `${BASE}/users`, label: "Users", icon: Users },
  { href: `${BASE}/listings`, label: "Listings", icon: Briefcase },
];

export function AdministratorSidebar() {
  const profile = useProfile();
  const approvals = useApprovals();
  const pending = approvals.data?.length ?? 0;
  const navItems = NAV_ITEMS.map((item) =>
    item.href === APPROVALS_HREF ? { ...item, badge: pending } : item,
  );

  return (
    <AppSidebar
      navItems={navItems}
      base={BASE}
      roleLabel="Administrator"
      ariaLabel="Administrator"
      displayName={profile.data?.displayName ?? profile.data?.email ?? ""}
    />
  );
}

export function AdministratorTopBar() {
  return <AppTopBar base={BASE} />;
}
