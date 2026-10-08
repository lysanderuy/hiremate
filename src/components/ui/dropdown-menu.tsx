"use client";

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import Link from "next/link";

import { cn } from "@/lib/utils";

const itemClassName =
  "flex min-h-10 w-full cursor-default items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-page [&_svg]:size-4 [&_svg]:shrink-0";

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root {...props} />;
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  className,
  align = "end",
  sideOffset = 6,
  ...props
}: MenuPrimitive.Popup.Props & Pick<MenuPrimitive.Positioner.Props, "align" | "sideOffset">) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner align={align} sideOffset={sideOffset} className="z-50">
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "min-w-58 rounded-md border border-line bg-white p-1 shadow-md outline-none transition-opacity duration-100 data-ending-style:opacity-0 data-starting-style:opacity-0",
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuItem({
  className,
  variant = "default",
  ...props
}: MenuPrimitive.Item.Props & { variant?: "default" | "destructive" }) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        itemClassName,
        variant === "destructive" && "text-error-strong data-highlighted:bg-error-soft",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuLinkItem({
  className,
  href,
  ...props
}: Omit<MenuPrimitive.LinkItem.Props, "render" | "href"> & { href: string }) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="dropdown-menu-link-item"
      render={<Link href={href} />}
      closeOnClick
      className={cn(itemClassName, className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
};
