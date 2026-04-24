"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type DocumentPreviewButtonProps = {
  href: string;
  title: string;
};

export function DocumentPreviewButton({
  href,
  title
}: DocumentPreviewButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} type="button" variant="secondary">
        Apri PDF
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex h-[88vh] w-full max-w-6xl flex-col overflow-hidden rounded-[8px] bg-background shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">
                  Visualizzazione documento PDF
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => window.open(href, "_blank", "noopener,noreferrer")}
                  type="button"
                  variant="secondary"
                >
                  Nuova scheda
                </Button>
                <Button onClick={() => setOpen(false)} type="button">
                  Chiudi
                </Button>
              </div>
            </div>
            <iframe className="min-h-0 flex-1 bg-muted" src={href} title={title} />
          </div>
        </div>
      ) : null}
    </>
  );
}
