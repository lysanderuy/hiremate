import Link from "next/link";

import { Logo } from "@/components/landing/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col bg-page">
      <div className="p-4 sm:p-6">
        <Logo href="/" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24 text-center">
        <p className="eyebrow">Error 404</p>
        <h1 className="text-auth-h1 font-semibold">Page not found</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          This page does not exist or was moved. Check the address, or go back to the home page.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className={cn(buttonVariants({ size: "lg" }), "text-sm")}>
            Go home
          </Link>
          <Link
            href="/dashboard"
            className={cn(buttonVariants({ variant: "outline", size: "lg" }), "text-sm")}
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
