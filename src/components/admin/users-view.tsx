"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  ACCOUNT_STATUS_LABELS,
  AccountStatusPill,
  ROLE_LABELS,
  reactivationMessage,
} from "@/components/admin/admin-status";
import { SuspendUserDialog, type SuspendTarget } from "@/components/admin/suspend-user-dialog";
import { UserDrawer } from "@/components/admin/user-drawer";
import { Avatar } from "@/components/shared/avatar";
import { ClickableRow } from "@/components/shared/clickable-row";
import { DataTable, Td, Th } from "@/components/shared/data-table";
import { FIELD_CLASS } from "@/components/shared/field-label";
import { TablePager } from "@/components/shared/table-pager";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminUsers } from "@/hooks/use-admin-users";
import { useDebounce } from "@/hooks/use-debounce";
import { useProfile } from "@/hooks/use-profile";
import { useReactivateUser } from "@/hooks/use-reactivate-user";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/stores/toast.store";
import { ACCOUNT_STATUSES, APP_ROLES, type AccountStatus, type AppRole } from "@/types/roles";
import type { AdminUserResponse } from "@/validators/admin-user.validator";

const APPROVALS_HREF = "/dashboard/administrator/approvals";

function SelectField({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-w-44 max-sm:min-w-35 max-sm:flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(FIELD_CLASS, "h-12 appearance-none pr-10 sm:text-base")}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export function UsersView() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<AppRole | undefined>();
  const [status, setStatus] = useState<AccountStatus | undefined>();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [suspending, setSuspending] = useState<SuspendTarget | null>(null);
  const q = useDebounce(search.trim());

  const { data, isPending, error } = useAdminUsers({ q, role, status, page });
  const profile = useProfile();
  const reactivate = useReactivateUser();
  const showToast = useToastStore((state) => state.show);

  const ownId = profile.data?.id;

  function clearFilters() {
    setSearch("");
    setRole(undefined);
    setStatus(undefined);
    setPage(1);
  }

  function handleReactivate(user: AdminUserResponse) {
    const name = user.displayName ?? user.email;
    reactivate.mutate(user.id, {
      onSuccess: (result) => showToast(reactivationMessage(name, result.accountStatus)),
      onError: (mutationError) => showToast(mutationError.message),
    });
  }

  function renderAction(user: AdminUserResponse) {
    const name = user.displayName ?? user.email;
    if (user.id === ownId) return <span className="text-muted-foreground">You</span>;
    if (user.role === "administrator") {
      return <span className="text-muted-foreground">No actions</span>;
    }
    switch (user.accountStatus) {
      case "active":
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setSuspending({ id: user.id, name, role: user.role })}
          >
            Suspend
          </Button>
        );
      case "suspended":
        return (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={reactivate.isPending && reactivate.variables === user.id}
            onClick={() => handleReactivate(user)}
          >
            Reactivate
          </Button>
        );
      case "pending":
        return (
          <Link
            href={APPROVALS_HREF}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Review
          </Link>
        );
      case "rejected":
        return <span className="text-muted-foreground">No actions</span>;
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-65 flex-1">
          <label htmlFor="users-search" className="sr-only">
            Search users
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-muted-foreground"
          />
          <input
            id="users-search"
            type="search"
            value={search}
            maxLength={80}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by name or email"
            className={cn(FIELD_CLASS, "h-12 pl-10.5 sm:text-base")}
          />
        </div>
        <SelectField
          id="users-role"
          label="Filter by role"
          value={role ?? ""}
          onChange={(value) => {
            setRole(APP_ROLES.find((item) => item === value));
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          {APP_ROLES.map((value) => (
            <option key={value} value={value}>
              {ROLE_LABELS[value]}
            </option>
          ))}
        </SelectField>
        <SelectField
          id="users-status"
          label="Filter by status"
          value={status ?? ""}
          onChange={(value) => {
            setStatus(ACCOUNT_STATUSES.find((item) => item === value));
            setPage(1);
          }}
        >
          <option value="">All statuses</option>
          {ACCOUNT_STATUSES.map((value) => (
            <option key={value} value={value}>
              {ACCOUNT_STATUS_LABELS[value]}
            </option>
          ))}
        </SelectField>
      </div>

      {isPending ? (
        <div role="status" aria-label="Loading users">
          <div className="h-72 animate-pulse rounded-xl border border-line bg-white" />
        </div>
      ) : error ? (
        <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
          {error.message}
        </p>
      ) : (
        <Card className="gap-0 py-0">
          {data.items.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <h3 className="mb-2 font-display text-lg font-semibold text-ink">
                No users match your search
              </h3>
              <p className="mb-4">Try another name, role or status.</p>
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <>
              <DataTable label="Users">
                <thead>
                  <tr>
                    <Th>User</Th>
                    <Th>Role</Th>
                    <Th>Status</Th>
                    <Th className="max-sm:hidden">Signed up</Th>
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((user) => {
                    const name = user.displayName ?? user.email;
                    return (
                      <ClickableRow key={user.id} onActivate={() => setSelectedId(user.id)}>
                        <Td className="h-18">
                          <div className="flex items-center gap-3">
                            <Avatar name={name} />
                            <div className="min-w-0">
                              <span className="block font-semibold break-words text-ink">
                                {name}
                              </span>
                              <small className="block max-w-65 truncate text-chip text-muted-foreground">
                                {user.email}
                              </small>
                            </div>
                          </div>
                        </Td>
                        <Td className="h-18">{ROLE_LABELS[user.role]}</Td>
                        <Td className="h-18">
                          <AccountStatusPill status={user.accountStatus} />
                        </Td>
                        <Td className="h-18 whitespace-nowrap max-sm:hidden">
                          {formatDate(user.createdAt)}
                        </Td>
                        <Td className="h-18 text-right whitespace-nowrap">{renderAction(user)}</Td>
                      </ClickableRow>
                    );
                  })}
                </tbody>
              </DataTable>
              <TablePager
                page={data.page}
                pageSize={data.pageSize}
                total={data.total}
                onPageChange={setPage}
              />
            </>
          )}
        </Card>
      )}

      <SuspendUserDialog target={suspending} onClose={() => setSuspending(null)} />
      <UserDrawer userId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}
