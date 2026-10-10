"use client";

import { Briefcase, ClipboardList, FileText, LayoutDashboard, User } from "lucide-react";

import { AppSidebar, AppTopBar, type NavItem } from "@/components/shared/app-sidebar";
import { useProfile } from "@/hooks/use-profile";

const BASE = "/dashboard/applicant";

const NAV_ITEMS: NavItem[] = [
  { href: BASE, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: `${BASE}/jobs`, label: "Browse jobs", icon: Briefcase },
  { href: `${BASE}/resume`, label: "My resume", icon: FileText },
  { href: `${BASE}/applications`, label: "My applications", icon: ClipboardList },
  { href: `${BASE}/profile`, label: "Profile", icon: User },
];

export function ApplicantSidebar() {
  const profile = useProfile();

  return (
    <AppSidebar
      navItems={NAV_ITEMS}
      base={BASE}
      roleLabel="Applicant"
      ariaLabel="Applicant"
      displayName={profile.data?.displayName ?? profile.data?.email ?? ""}
      subtitle={profile.data?.email ?? ""}
    />
  );
}

export function ApplicantTopBar() {
  return <AppTopBar base={BASE} />;
}
