"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-16 items-center border-b border-border px-6">
        <div>
          <p className="text-lg font-semibold tracking-tight">GiaFarm</p>
          <p className="text-xs text-muted-foreground">Gestionale agricolo</p>
        </div>
      </div>
      <nav className="space-y-1 p-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              className={cn(
                "focus-ring flex items-center gap-3 rounded-[8px] px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground",
                isActive && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              )}
              href={item.href}
              key={item.href}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
