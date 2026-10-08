"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Logo } from "@/components/landing/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Segment error boundary: catches render/data errors below the root layout.
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-dvh flex-col bg-page">
      <div className="p-4 sm:p-6">
        <Logo href="/" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 text-center">
        <p className="eyebrow">Error</p>
        <h1 className="text-auth-h1 font-semibold">Something went wrong</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          This page could not be loaded. Try again. If it keeps happening, come back later.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-muted-foreground">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" onClick={reset} className="text-sm">
            Try again
          </Button>
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-sm")}
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
