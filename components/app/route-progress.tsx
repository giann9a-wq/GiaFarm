"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function isInternalLink(target: EventTarget | null) {
  const anchor = target instanceof Element ? target.closest("a") : null;
  if (!anchor) return false;
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  if (anchor.getAttribute("target") === "_blank") return false;
  return href.startsWith("/") || href.startsWith(window.location.origin);
}

export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<number | null>(null);
  const maxWaitRef = useRef<number | null>(null);

  useEffect(() => {
    function start() {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (maxWaitRef.current) {
        window.clearTimeout(maxWaitRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setPending(true), 120);
      maxWaitRef.current = window.setTimeout(() => setPending(false), 10000);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }
      if (isInternalLink(event.target)) start();
    }

    function onSubmit() {
      start();
    }

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (maxWaitRef.current) {
        window.clearTimeout(maxWaitRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    if (maxWaitRef.current) {
      window.clearTimeout(maxWaitRef.current);
    }
    setPending(false);
  }, [pathname, searchParams]);

  if (!pending) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="h-1 w-full overflow-hidden bg-primary/15">
        <div className="h-full w-1/2 animate-[giafarm-progress_1s_ease-in-out_infinite] bg-primary" />
      </div>
      <div className="absolute right-4 top-3 rounded-[8px] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-sm">
        Caricamento...
      </div>
    </div>
  );
}
