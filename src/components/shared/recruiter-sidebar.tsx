"use client";

import { Briefcase, LayoutDashboard, User, Users } from "lucide-react";

import { AppSidebar, AppTopBar, type NavItem } from "@/components/shared/app-sidebar";
import { useCompany } from "@/hooks/use-company";
import { useProfile } from "@/hooks/use-profile";

const BASE = "/dashboard/recruiter";

const NAV_ITEMS: NavItem[] = [
  { href: BASE, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: `${BASE}/listings`, label: "Listings", icon: Briefcase },
  { href: `${BASE}/applicants`, label: "Applicants", icon: Users },
  { href: `${BASE}/profile`, label: "Profile", icon: User },
];

export function RecruiterSidebar() {
  const profile = useProfile();
  const company = useCompany();

  return (
    <AppSidebar
      navItems={NAV_ITEMS}
      base={BASE}
      roleLabel="Recruiter"
      ariaLabel="Recruiter"
      displayName={profile.data?.displayName ?? profile.data?.email ?? ""}
      subtitle={company.data?.name ?? ""}
    />
  );
}

export function RecruiterTopBar() {
  return <AppTopBar base={BASE} />;
}
