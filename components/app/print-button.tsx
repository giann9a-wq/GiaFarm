"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Stampa / salva PDF" }: { label?: string }) {
  return (
    <Button onClick={() => window.print()} type="button">
      {label}
    </Button>
  );
}
