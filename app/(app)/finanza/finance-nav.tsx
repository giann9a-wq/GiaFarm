import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FinanceNav() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild variant="secondary">
        <Link href="/finanza">Dashboard</Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="/finanza/costi">Costi</Link>
      </Button>
      <Button asChild variant="secondary">
        <Link href="/finanza/ricavi">Ricavi</Link>
      </Button>
    </div>
  );
}
