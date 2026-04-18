"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-2 overflow-x-auto border-b border-border bg-card px-4 py-3 lg:hidden">
      {navigationItems.map((item) => {
        const isActive =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            className={cn(
              "focus-ring whitespace-nowrap rounded-[8px] border border-border px-3 py-2 text-sm font-medium text-muted-foreground",
              isActive && "border-primary bg-primary text-primary-foreground"
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
