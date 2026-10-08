"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Logo, SparkleIcon } from "@/components/landing/logo";
import { Avatar } from "@/components/shared/avatar";
import { DiscardGuardLink } from "@/components/shared/discard-guard-link";
import { LogoutButton } from "@/components/shared/logout-button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useCompany } from "@/hooks/use-company";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui.store";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
};

const BASE = "/dashboard/recruiter";

const NAV_ITEMS: NavItem[] = [
  { href: BASE, label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: `${BASE}/listings`, label: "Listings", icon: Briefcase },
  { href: `${BASE}/applicants`, label: "Applicants", icon: Users },
  { href: `${BASE}/profile`, label: "Profile", icon: User },
];

const ITEM_CLASS =
  "flex w-full items-center gap-3 rounded-md font-medium whitespace-nowrap text-on-night transition-colors hover:bg-white/7 hover:text-white focus-visible:outline-white";

function isActive(pathname: string, item: NavItem) {
  return item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function SidebarContent({
  collapsed = false,
  onNavigate,
  onToggleCollapse,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const profile = useProfile();
  const company = useCompany();
  const displayName = profile.data?.displayName ?? profile.data?.email ?? "";
  const companyName = company.data?.name ?? "";

  return (
    <div className="flex h-full flex-col px-4 py-6">
      <div
        className={cn(
          "mb-8 flex min-h-10 items-center",
          collapsed ? "justify-center" : "justify-between gap-2",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            aria-expanded={false}
            className="group flex size-10 items-center justify-center rounded-[25%] bg-primary text-white focus-visible:outline-white"
          >
            <SparkleIcon className="size-5.5 group-hover:hidden group-focus-visible:hidden" />
            <PanelLeftOpen className="hidden size-5 group-hover:block group-focus-visible:block" />
          </button>
        ) : (
          <>
            <Link
              href={BASE}
              aria-label="TalentFlow AI home"
              className="flex min-w-0 items-center gap-3 rounded-md focus-visible:outline-white"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-[25%] bg-primary text-white">
                <SparkleIcon className="size-5.5" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="font-display text-base leading-tight font-semibold tracking-[-0.02em] whitespace-nowrap text-white">
                  TalentFlow AI
                </span>
                <span className="text-xs text-on-night-muted">Recruiter</span>
              </span>
            </Link>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                aria-expanded
                className="flex size-10 shrink-0 items-center justify-center rounded-md text-on-night-muted transition-colors hover:bg-white/8 hover:text-white focus-visible:outline-white"
              >
                <PanelLeftClose className="size-5" />
              </button>
            )}
          </>
        )}
      </div>

      <nav aria-label="Recruiter" className="grid gap-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <DiscardGuardLink
              key={item.href}
              href={item.href}
              onNavigate={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                ITEM_CLASS,
                "h-10 px-4 text-sm",
                collapsed && "justify-center px-0",
                active && "bg-primary text-white hover:bg-primary-hover",
              )}
            >
              <item.icon className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </DiscardGuardLink>
          );
        })}
      </nav>

      <div className="mt-auto grid gap-2 border-t border-white/10 pt-4">
        {displayName && (
          <div
            className={cn(
              "flex min-w-0 items-center gap-3 py-2",
              collapsed ? "justify-center" : "px-4",
            )}
          >
            <Avatar name={displayName} className="bg-white/12 text-white" />
            {!collapsed && (
              <span className="min-w-0">
                <span className="block truncate text-sm leading-snug font-semibold text-white">
                  {displayName}
                </span>
                {companyName && (
                  <span className="block truncate text-xs leading-snug text-on-night-muted">
                    {companyName}
                  </span>
                )}
              </span>
            )}
          </div>
        )}
        <LogoutButton
          className={cn(
            ITEM_CLASS,
            "h-10 border-0 bg-transparent px-4 py-0 text-left text-sm",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          <span className={cn(collapsed && "sr-only")}>Log out</span>
        </LogoutButton>
      </div>
    </div>
  );
}

export function RecruiterSidebar() {
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleCollapsed = useUiStore((state) => state.toggleSidebarCollapsed);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 961px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setSidebarOpen(false);
    };
    query.addEventListener("change", closeOnDesktop);
    return () => query.removeEventListener("change", closeOnDesktop);
  }, [setSidebarOpen]);

  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 bg-night transition-[width] duration-200 min-[961px]:block",
          collapsed ? "w-19" : "w-66",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="gap-0 border-0 bg-night p-0 data-[side=left]:w-66 data-[side=left]:max-w-[85vw] min-[961px]:hidden"
        >
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent onNavigate={() => setSidebarOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

export function RecruiterTopBar() {
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white px-4 min-[961px]:hidden">
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open navigation"
        aria-expanded={sidebarOpen}
        className="flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-page"
      >
        <Menu className="size-5" />
      </button>
      <Logo href={BASE} size="sm" />
    </header>
  );
}
