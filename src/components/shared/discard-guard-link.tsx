"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Discard your changes?"
        description="You have unsaved changes. If you leave now, they will be lost."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        danger
        onConfirm={discard}
      />
    </>
  );
}
