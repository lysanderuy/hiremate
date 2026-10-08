"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useFormGuardStore } from "@/stores/form-guard.store";

type DiscardGuardLinkProps = Omit<React.ComponentProps<typeof Link>, "onClick" | "href"> & {
  href: string;
  onNavigate?: () => void;
};

export function DiscardGuardLink({
  href,
  onNavigate,
  children,
  ...linkProps
}: DiscardGuardLinkProps) {
  const router = useRouter();
  const dirty = useFormGuardStore((state) => state.dirty);
  const [open, setOpen] = useState(false);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (!dirty) {
      onNavigate?.();
      return;
    }
    event.preventDefault();
    setOpen(true);
  }

  function discard() {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  return (
    <>
      <Link href={href} onClick={handleClick} {...linkProps}>
        {children}
      </Link>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. If you leave now, they will be lost.
          </AlertDialogDescription>
          <div className="flex justify-end gap-2">
            <AlertDialogClose className={buttonVariants({ variant: "outline", size: "lg" })}>
              Keep editing
            </AlertDialogClose>
            <Button type="button" variant="destructive" size="lg" onClick={discard}>
              Discard
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
