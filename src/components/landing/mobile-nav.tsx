"use client";

import { Menu } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Logo } from "./logo";

type MobileNavProps = {
  links: { label: string; href: string }[];
};

export function MobileNav({ links }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open menu"
            className="size-10 text-navy lg:hidden"
          />
        }
      >
        <Menu className="size-5" />
      </SheetTrigger>
      <SheetContent side="right" className="w-4/5 max-w-xs gap-0">
        <SheetHeader className="border-b p-4 pr-14">
          <SheetTitle>
            <Logo />
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-2">
          {links.map((link) => (
            <SheetClose
              key={link.href}
              nativeButton={false}
              render={
                <a
                  href={link.href}
                  className="flex h-12 items-center rounded-lg px-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-navy"
                />
              }
            >
              {link.label}
            </SheetClose>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t p-4">
          <Button variant="outline" className="h-11 w-full text-sm" onClick={() => setOpen(false)}>
            Sign In
          </Button>
          <Button className="h-11 w-full text-sm" onClick={() => setOpen(false)}>
            Get Started
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
