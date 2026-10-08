import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type LogoutButtonProps = {
  className?: string;
  children?: ReactNode;
};

export function LogoutButton({ className, children = "Sign out" }: LogoutButtonProps) {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={cn(
          "rounded-md border border-line px-3 py-1.5 text-sm text-ink hover:bg-page",
          className,
        )}
      >
        {children}
      </button>
    </form>
  );
}
