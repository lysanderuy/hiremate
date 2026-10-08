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
  Settings,
  Sparkles,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Logo } from "@/components/landing/logo";
import { LogoutButton } from "@/components/shared/logout-button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
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
  { href: `${BASE}/candidates`, label: "Candidates", icon: Users },
  { href: `${BASE}/profile`, label: "Profile", icon: User },
  { href: `${BASE}/settings`, label: "Settings", icon: Settings },
];

const ITEM_CLASS =
  "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-tint-border transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

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

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex items-center pt-5 pb-4",
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-4",
        )}
      >
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Expand sidebar"
            aria-expanded={false}
            className="group flex size-9 items-center justify-center rounded-lg bg-primary text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            <Sparkles className="size-5 group-hover:hidden group-focus-visible:hidden" />
            <PanelLeftOpen className="hidden size-5 group-hover:block group-focus-visible:block" />
          </button>
        ) : (
          <>
            <Link
              href={BASE}
              aria-label="Talentflow AI home"
              className="flex min-w-0 items-center gap-2.5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white">
                <Sparkles className="size-5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="whitespace-nowrap text-base font-semibold text-white">
                  Talentflow AI
                </span>
                <span className="text-xs text-tint-border">Recruiter</span>
              </span>
            </Link>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                aria-label="Collapse sidebar"
                aria-expanded
                className="flex size-8 shrink-0 items-center justify-center rounded-lg text-tint-border transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <PanelLeftClose className="size-5" />
              </button>
            )}
          </>
        )}
      </div>

      <nav aria-label="Recruiter" className="mt-3 flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
              className={cn(
                ITEM_CLASS,
                collapsed && "justify-center px-0",
                active && "bg-primary text-white hover:bg-primary-hover",
              )}
            >
              <item.icon className="size-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-white/10 p-3">
        <LogoutButton
          className={cn(
            ITEM_CLASS,
            "border-0 px-3 py-0 text-left",
            collapsed && "justify-center px-0",
          )}
        >
          <LogOut className="size-5 shrink-0" aria-hidden />
          <span className={cn(collapsed && "sr-only")}>Logout</span>
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
    const query = window.matchMedia("(min-width: 768px)");
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
          "sticky top-0 hidden h-screen shrink-0 bg-navy transition-[width] duration-200 md:block",
          collapsed ? "w-16" : "w-70",
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-70 max-w-[85vw] gap-0 border-0 bg-navy p-0 md:hidden"
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
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-3 border-b border-border bg-white px-4 md:hidden">
      <Logo href={BASE} />
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label="Open navigation"
        aria-expanded={sidebarOpen}
        className="flex size-9 items-center justify-center rounded-lg text-navy hover:bg-muted"
      >
        <Menu className="size-5" />
      </button>
    </header>
  );
}
