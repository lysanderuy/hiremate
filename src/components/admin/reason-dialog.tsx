"use client";

import { useState } from "react";

import { FIELD_CLASS, FieldLabel } from "@/components/shared/field-label";
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder: string;
  help: string;
  confirmLabel: string;
  maxLength: number;
  pending: boolean;
  error: string | null;
  onConfirm: (reason: string) => void;
};

// Mount with a key per target so the reason resets between openings.
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  placeholder,
  help,
  confirmLabel,
  maxLength,
  pending,
  error,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState("");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <div className="mt-2 grid gap-1.5">
          <FieldLabel htmlFor="admin-reason" optional>
            Reason
          </FieldLabel>
          <textarea
            id="admin-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            maxLength={maxLength}
            placeholder={placeholder}
            rows={4}
            className={cn(FIELD_CLASS, "h-auto min-h-27.5 resize-y py-3 leading-relaxed")}
          />
          <span className="text-chip text-muted-foreground">
            {help} {reason.length} / {maxLength} characters.
          </span>
        </div>
        {error && (
          <p role="alert" className="rounded-md bg-error-soft px-4 py-3 text-error">
            {error}
          </p>
        )}
        <div className="mt-3 flex justify-end gap-3">
          <AlertDialogClose className={buttonVariants({ variant: "outline" })}>
            Cancel
          </AlertDialogClose>
          <Button
            type="button"
            disabled={pending}
            onClick={() => onConfirm(reason.trim())}
            className="bg-error hover:bg-error-strong active:bg-error-strong"
          >
            {confirmLabel}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
