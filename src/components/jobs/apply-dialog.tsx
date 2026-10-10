"use client";

import { MATCH_BAND_LABELS } from "@/components/shared/match-score";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import type { MatchSummary } from "@/validators/open-listing.validator";

type ApplyDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  company: string;
  resumeSavedLabel: string;
  match: MatchSummary | null;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
};

export function ApplyDialog({
  open,
  onOpenChange,
  title,
  company,
  resumeSavedLabel,
  match,
  pending,
  error,
  onConfirm,
}: ApplyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>Apply to {title}?</AlertDialogTitle>
        <AlertDialogDescription>
          We will send your current resume to {company}. You cannot change what you send after you
          apply.
        </AlertDialogDescription>
        <dl className="grid gap-2 rounded-md bg-page px-4 py-3">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Resume</dt>
            <dd className="font-medium text-ink">{resumeSavedLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Match score</dt>
            <dd className="font-medium text-ink">
              {match ? `${match.score} ${MATCH_BAND_LABELS[match.band]}` : "Not scored"}
            </dd>
          </div>
        </dl>
        {match?.band === "weak" && (
          <p className="text-xs text-muted-foreground">
            This is a weak match. You can still apply.
          </p>
        )}
        {error && (
          <p role="alert" className="rounded-md bg-error-soft px-3 py-2 text-xs text-error">
            {error}
          </p>
        )}
        <div className="mt-2 flex justify-end gap-3">
          <AlertDialogClose className={buttonVariants({ variant: "outline", size: "sm" })}>
            Cancel
          </AlertDialogClose>
          <Button type="button" size="sm" disabled={pending} onClick={onConfirm}>
            {pending ? "Sending..." : "Send application"}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
