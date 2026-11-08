import { StatusPill, type PillTone } from "@/components/shared/status-pill";
import type { JobStatus } from "@/types/jobs";
import type { AccountStatus, AppRole } from "@/types/roles";

export const ROLE_LABELS: Record<AppRole, string> = {
  applicant: "Applicant",
  recruiter: "Recruiter",
  administrator: "Administrator",
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  pending: "Pending",
  rejected: "Rejected",
  suspended: "Suspended",
};

const ACCOUNT_STATUS_TONES: Record<AccountStatus, PillTone> = {
  active: "open",
  pending: "pending",
  rejected: "rejected",
  suspended: "closed",
};

const LISTING_STATUS_LABELS: Record<JobStatus, string> = {
  open: "Open",
  closed: "Closed",
  removed: "Removed",
};

const LISTING_STATUS_TONES: Record<JobStatus, PillTone> = {
  open: "open",
  closed: "closed",
  removed: "removed",
};

export function AccountStatusPill({ status }: { status: AccountStatus }) {
  return (
    <StatusPill tone={ACCOUNT_STATUS_TONES[status]}>{ACCOUNT_STATUS_LABELS[status]}</StatusPill>
  );
}

export function ListingStatusPill({ status }: { status: JobStatus }) {
  return (
    <StatusPill tone={LISTING_STATUS_TONES[status]}>{LISTING_STATUS_LABELS[status]}</StatusPill>
  );
}

export function reactivationMessage(name: string, status: AccountStatus): string {
  return status === "pending"
    ? `${name} was never approved, so the account is Pending.`
    : `${name} reactivated.`;
}
