"use client";

import Link from "next/link";

import { ACCOUNT_STATUS_LABELS, ROLE_LABELS } from "@/components/admin/admin-status";
import { ApplicationsChart } from "@/components/admin/applications-chart";
import { MATCH_BAND_LABELS } from "@/components/shared/match-score";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAdminDashboard } from "@/hooks/use-admin-dashboard";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ACCOUNT_STATUSES, APP_ROLES } from "@/types/roles";
import { APPLICATION_BANDS } from "@/validators/application.validator";
import type { AdminDashboardResponse } from "@/validators/admin-dashboard.validator";

const BASE = "/dashboard/administrator";

const ROW_CLASS = "flex items-center justify-between gap-4 border-t border-line px-5 py-3.5";
const LINK_CLASS = "text-sm font-medium text-primary hover:underline";

function CardHead({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3">
      <h2 className="font-display text-lg font-semibold tracking-[-0.01em] text-ink">{title}</h2>
      {aside}
    </div>
  );
}

function Aside({ children, className }: { children: React.ReactNode; className?: string }) {
  return <small className={cn("text-sm text-muted-foreground", className)}>{children}</small>;
}

function Bar({ percent }: { percent: number }) {
  return (
    <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-weak-soft">
      <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
    </div>
  );
}

function AttentionRow({
  count,
  label,
  help,
  action,
  href,
}: {
  count: number;
  label: string;
  help: string;
  action: string;
  href: string;
}) {
  return (
    <div className="grid grid-cols-[48px_1fr_88px] items-center gap-4 border-t border-line px-5 py-3.5 max-[640px]:grid-cols-[40px_1fr] max-[640px]:gap-y-2 max-[640px]:px-4">
      <b
        className={cn(
          "font-display text-[1.75rem] leading-none font-semibold tracking-[-0.03em] tabular-nums",
          count > 0 ? "text-ink" : "text-muted-foreground",
        )}
      >
        {count}
      </b>
      <div>
        <span className="block font-medium text-ink">{label}</span>
        <small className="mt-0.5 block text-chip text-muted-foreground">
          {count > 0 ? help : "Nothing right now."}
        </small>
      </div>
      {count > 0 && (
        <Link
          href={href}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "justify-self-end max-[640px]:col-start-2 max-[640px]:justify-self-start",
          )}
        >
          {action}
        </Link>
      )}
    </div>
  );
}

function AttentionCard({ attention }: { attention: AdminDashboardResponse["attention"] }) {
  return (
    <Card className="mb-6 gap-0 py-0">
      <CardHead
        title="Needs attention"
        aside={<Aside className="max-[640px]:hidden">Counts update as you act.</Aside>}
      />
      <AttentionRow
        count={attention.pendingRecruiters}
        label="Recruiters waiting for approval"
        help="They cannot post listings until approved."
        action="Review"
        href={`${BASE}/approvals`}
      />
      <AttentionRow
        count={attention.openListingsWithoutApplications}
        label="Open listings with no applications"
        help="Nobody has applied to these yet."
        action="View"
        href={`${BASE}/listings?filter=empty`}
      />
      <AttentionRow
        count={attention.preparingListings}
        label="Listings still preparing"
        help="Match scores are not ready for these."
        action="View"
        href={`${BASE}/listings?filter=preparing`}
      />
    </Card>
  );
}

function StatTile({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Card className="gap-2 p-4 min-[641px]:p-5">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex flex-wrap items-baseline gap-2 font-display text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.03em] text-ink tabular-nums min-[641px]:text-[2rem]">
        {children}
      </div>
    </Card>
  );
}

function StatTiles({ data }: { data: AdminDashboardResponse | undefined }) {
  if (!data) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-3 min-[641px]:gap-4 min-[1101px]:grid-cols-4">
        {["Total users", "Open listings", "Total applications", "Avg match score"].map((label) => (
          <StatTile key={label} label={label}>
            <span
              role="status"
              aria-label={`Loading ${label}`}
              className="block h-9 w-14 animate-pulse rounded-md bg-weak-soft"
            />
          </StatTile>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 min-[641px]:gap-4 min-[1101px]:grid-cols-4">
      <StatTile label="Total users">{data.totalUsers}</StatTile>
      <StatTile label="Open listings">{data.listingsByStatus.open}</StatTile>
      <StatTile label="Total applications">{data.totalApplications}</StatTile>
      <StatTile label="Avg match score">
        {data.averageMatchScore === null ? (
          <span className="text-xl">No scores yet</span>
        ) : (
          <>
            {data.averageMatchScore}
            <small className="text-base font-medium tracking-normal text-muted-foreground">
              /100
            </small>
            {data.averageMatchBand && (
              <Badge
                variant={data.averageMatchBand}
                className="self-center font-sans tracking-normal"
              >
                {MATCH_BAND_LABELS[data.averageMatchBand]}
              </Badge>
            )}
          </>
        )}
      </StatTile>
    </div>
  );
}

function RowsLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-end border-t border-line px-5 pt-4 pb-2 font-display text-chip font-semibold tracking-[0.08em] text-muted-foreground uppercase">
      {children}
    </div>
  );
}

function CountRow({ label, children }: { label: React.ReactNode; children: number }) {
  return (
    <div className={ROW_CLASS}>
      <span className="text-text">{label}</span>
      <b className="text-right font-semibold text-ink tabular-nums">{children}</b>
    </div>
  );
}

function UsersCard({ data }: { data: AdminDashboardResponse }) {
  const pending = data.usersByStatus.pending;

  return (
    <Card className="gap-0 py-0">
      <CardHead
        title="Users"
        aside={
          <Link href={`${BASE}/users`} className={LINK_CLASS}>
            View all
          </Link>
        }
      />
      <div className="grid flex-1 auto-rows-fr">
        <RowsLabel>By role</RowsLabel>
        {APP_ROLES.map((role) => (
          <CountRow key={role} label={`${ROLE_LABELS[role]}s`}>
            {data.usersByRole[role]}
          </CountRow>
        ))}
        <RowsLabel>By account status</RowsLabel>
        {ACCOUNT_STATUSES.map((status) => (
          <CountRow
            key={status}
            label={
              status === "pending" && pending > 0 ? (
                <>
                  {ACCOUNT_STATUS_LABELS[status]}
                  <Link href={`${BASE}/approvals`} className={cn(LINK_CLASS, "ml-3")}>
                    Review
                  </Link>
                </>
              ) : (
                ACCOUNT_STATUS_LABELS[status]
              )
            }
          >
            {data.usersByStatus[status]}
          </CountRow>
        ))}
      </div>
    </Card>
  );
}

function ListingsCard({ data }: { data: AdminDashboardResponse }) {
  return (
    <Card className="gap-0 py-0">
      <CardHead
        title="Listings by status"
        aside={
          <Link href={`${BASE}/listings`} className={LINK_CLASS}>
            View all
          </Link>
        }
      />
      <div>
        <CountRow label="Open">{data.listingsByStatus.open}</CountRow>
        <CountRow label="Closed">{data.listingsByStatus.closed}</CountRow>
        <CountRow label="Removed">{data.listingsByStatus.removed}</CountRow>
        <CountRow label="Open but hidden, recruiter not active">{data.hiddenOpenListings}</CountRow>
      </div>
    </Card>
  );
}

function MatcherCard({ matcher }: { matcher: AdminDashboardResponse["matcher"] }) {
  const items: [string, React.ReactNode][] = [
    ["Model", matcher.model],
    ["Version", matcher.version],
    ["Skills in the list", matcher.skillCount],
    ["Trained on", `${matcher.pairs} rated pairs`],
    ["Trained", formatDate(matcher.trainedAt)],
    ["Resumes failed to process", matcher.resumesFailed],
  ];

  return (
    <Card className="flex-1 gap-0 py-0">
      <CardHead title="Matcher" aside={<Aside>Read only</Aside>} />
      <dl aria-label="Matcher" className="grid gap-3 px-5 pt-1 pb-5">
        {items.map(([name, value]) => (
          <div key={name} className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{name}</dt>
            <dd className="text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function MatchBandsCard({ data }: { data: AdminDashboardResponse }) {
  const total = data.totalApplications;
  const fairOrStrong = data.matchBands.strong + data.matchBands.fair;

  return (
    <Card className="gap-0 py-0">
      <CardHead title="Match bands" aside={<Aside>All applications</Aside>} />
      <div className="px-5 pt-2 pb-5">
        {APPLICATION_BANDS.map((band) => (
          <div key={band} className="grid grid-cols-[80px_1fr_40px] items-center gap-4 py-2.5">
            <Badge variant={band}>{MATCH_BAND_LABELS[band]}</Badge>
            <Bar percent={total > 0 ? (data.matchBands[band] / total) * 100 : 0} />
            <b className="text-right text-ink tabular-nums">{data.matchBands[band]}</b>
          </div>
        ))}
        <p className="mt-3 text-chip text-muted-foreground">
          Fair or Strong: {fairOrStrong} of {total} applications.
        </p>
      </div>
    </Card>
  );
}

function TopSkillsCard({ skills }: { skills: AdminDashboardResponse["topSkills"] }) {
  const max = Math.max(...skills.map((skill) => skill.count), 1);

  return (
    <Card className="gap-0 py-0">
      <CardHead title="Most requested skills" aside={<Aside>Across open listings</Aside>} />
      {skills.length === 0 ? (
        <p className="border-t border-line px-5 py-10 text-center text-muted-foreground">
          No open listings use skills yet.
        </p>
      ) : (
        <ol>
          {skills.map((skill, index) => (
            <li key={skill.name} className="border-t border-line px-5 py-3">
              <div className="mb-2 flex justify-between gap-4">
                <span className="min-w-0 font-medium break-words text-ink">
                  <i className="mr-2 font-normal text-muted-foreground not-italic tabular-nums">
                    {index + 1}.
                  </i>
                  {skill.name}
                </span>
                <b className="font-semibold text-ink tabular-nums">{skill.count}</b>
              </div>
              <Bar percent={(skill.count / max) * 100} />
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

export function AdminDashboard() {
  const { data, isPending, error } = useAdminDashboard();

  if (error) {
    return (
      <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
        {error.message}
      </p>
    );
  }

  if (isPending) {
    return (
      <div role="status" aria-label="Loading dashboard">
        <StatTiles data={undefined} />
        <div className="h-72 animate-pulse rounded-xl border border-line bg-white" />
      </div>
    );
  }

  const firstDay = data.applicationsPerDay[0];
  const lastDay = data.applicationsPerDay[data.applicationsPerDay.length - 1];

  return (
    <div>
      <AttentionCard attention={data.attention} />
      <StatTiles data={data} />

      <div className="mb-6 grid items-stretch gap-6 min-[1101px]:grid-cols-2">
        <UsersCard data={data} />
        <div className="flex flex-col gap-6">
          <ListingsCard data={data} />
          <MatcherCard matcher={data.matcher} />
        </div>
      </div>

      <div className="mb-6 grid items-start gap-6 min-[1101px]:grid-cols-[1.7fr_1fr]">
        <Card className="gap-0 py-0">
          <CardHead
            title="Applications, last 30 days"
            aside={
              firstDay && lastDay ? (
                <Aside>
                  {formatDate(firstDay.date)} to {formatDate(lastDay.date)}
                </Aside>
              ) : undefined
            }
          />
          <div className="px-5 pt-2 pb-5">
            <ApplicationsChart days={data.applicationsPerDay} />
          </div>
        </Card>
        <MatchBandsCard data={data} />
      </div>

      <TopSkillsCard skills={data.topSkills} />
    </div>
  );
}
