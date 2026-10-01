"use client";

import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

type AuthInputProps = React.ComponentProps<"input"> & {
  label: string;
  icon: LucideIcon;
  labelAction?: React.ReactNode;
};

const inputClassName =
  "h-11 w-full rounded-lg border border-border bg-white pr-3 pl-10 text-sm text-navy outline-none transition-colors placeholder:text-slate-400 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring";

export function AuthInput({
  label,
  icon: Icon,
  labelAction,
  type,
  className,
  ...props
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-navy">{label}</span>
        {labelAction}
      </div>
      <div className="relative">
        <Icon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
        <input
          {...props}
          type={isPassword && showPassword ? "text" : type}
          className={cn(inputClassName, isPassword && "pr-11", className)}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded text-slate-400 transition-colors outline-none hover:text-navy focus-visible:ring-3 focus-visible:ring-ring"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </label>
  );
}
