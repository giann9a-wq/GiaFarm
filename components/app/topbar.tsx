import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";

type TopbarProps = {
  userName?: string | null;
  userEmail?: string | null;
};

export function Topbar({ userName, userEmail }: TopbarProps) {
  return (
    <header className="flex min-h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 py-3 sm:px-6">
      <div>
        <p className="text-sm font-semibold">Dashboard operativa</p>
        <p className="text-xs text-muted-foreground">
          {userName ?? userEmail ?? "Utente GiaFarm"}
        </p>
      </div>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <Button type="submit" variant="secondary">
          Esci
        </Button>
      </form>
    </header>
  );
}
