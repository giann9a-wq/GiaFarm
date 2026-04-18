import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <section className="w-full max-w-md rounded-[8px] border border-border bg-card p-8 shadow-soft">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          GiaFarm
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Accesso al gestionale
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Entra con l&apos;account Google autorizzato per gestire campi, lavorazioni,
          documenti, magazzino e risultati aziendali.
        </p>
        <form
          className="mt-8"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <Button className="w-full" type="submit">
            Continua con Google
          </Button>
        </form>
        <p className="mt-5 text-xs leading-5 text-muted-foreground">
          L&apos;accesso e&apos; limitato alle email presenti in whitelist o configurate
          come amministratori iniziali.
        </p>
      </section>
    </main>
  );
}
