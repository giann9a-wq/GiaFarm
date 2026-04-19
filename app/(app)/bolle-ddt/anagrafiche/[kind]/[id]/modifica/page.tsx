import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  updateCustomerAction,
  updateDdtDestinationAction,
  updateSupplierAction,
} from "@/app/(app)/bolle-ddt/actions";
import { prisma } from "@/lib/prisma";

type EditMasterDataPageProps = {
  params: Promise<{ kind: string; id: string }>;
};

export default async function EditMasterDataPage({
  params,
}: EditMasterDataPageProps) {
  const { kind, id } = await params;
  const customers = await prisma.customer.findMany({
    orderBy: { businessName: "asc" },
  });

  if (kind === "supplier") {
    const supplier = await prisma.supplier.findUnique({ where: { id } });
    if (!supplier) notFound();
    return (
      <MasterDataShell
        title={`Modifica ${supplier.businessName}`}
        subtitle="Anagrafica fornitore per bolle in ingresso."
      >
        <form
          action={updateSupplierAction.bind(null, supplier.id)}
          className="grid gap-3 md:grid-cols-2"
        >
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={supplier.businessName}
            name="businessName"
            placeholder="Ragione sociale"
            required
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={supplier.vatNumber ?? ""}
            name="vatNumber"
            placeholder="Partita IVA"
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={supplier.taxCode ?? ""}
            name="taxCode"
            placeholder="Codice fiscale"
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={supplier.email ?? ""}
            name="email"
            placeholder="Email"
            type="email"
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={supplier.phone ?? ""}
            name="phone"
            placeholder="Telefono"
          />
          <textarea
            className="focus-ring min-h-24 rounded-[8px] border border-input bg-background px-3 py-2 md:col-span-2"
            defaultValue={supplier.notes ?? ""}
            name="notes"
            placeholder="Note"
          />
          <Button className="md:col-span-2" type="submit">
            Salva modifiche
          </Button>
        </form>
      </MasterDataShell>
    );
  }

  if (kind === "customer") {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) notFound();
    return (
      <MasterDataShell
        title={`Modifica ${customer.businessName}`}
        subtitle="Anagrafica destinatario DDT."
      >
        <form
          action={updateCustomerAction.bind(null, customer.id)}
          className="grid gap-3 md:grid-cols-2"
        >
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={customer.businessName}
            name="businessName"
            placeholder="Ragione sociale"
            required
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={customer.address ?? ""}
            name="address"
            placeholder="Indirizzo"
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={customer.vatNumber ?? ""}
            name="vatNumber"
            placeholder="Partita IVA"
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={customer.taxCode ?? ""}
            name="taxCode"
            placeholder="Codice fiscale"
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={customer.email ?? ""}
            name="email"
            placeholder="Email"
            type="email"
          />
          <input
            className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
            defaultValue={customer.phone ?? ""}
            name="phone"
            placeholder="Telefono"
          />
          <textarea
            className="focus-ring min-h-24 rounded-[8px] border border-input bg-background px-3 py-2 md:col-span-2"
            defaultValue={customer.notes ?? ""}
            name="notes"
            placeholder="Note"
          />
          <Button className="md:col-span-2" type="submit">
            Salva modifiche
          </Button>
        </form>
      </MasterDataShell>
    );
  }

  if (kind === "destination") {
    const destination = await prisma.ddtDestination.findUnique({
      where: { id },
    });
    if (!destination) notFound();
    return (
      <MasterDataShell
        title={`Modifica ${destination.name}`}
        subtitle="Destinazione ricorrente per DDT."
      >
        <form
          action={updateDdtDestinationAction.bind(null, destination.id)}
          className="space-y-3"
        >
          <select
            className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={destination.customerId ?? ""}
            name="customerId"
          >
            <option value="">Nessun destinatario collegato</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.businessName}
              </option>
            ))}
          </select>
          <input
            className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={destination.name}
            name="name"
            placeholder="Nome destinazione"
            required
          />
          <input
            className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={destination.address ?? ""}
            name="address"
            placeholder="Indirizzo destinazione"
          />
          <textarea
            className="focus-ring min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
            defaultValue={destination.notes ?? ""}
            name="notes"
            placeholder="Note"
          />
          <Button type="submit">Salva modifiche</Button>
        </form>
      </MasterDataShell>
    );
  }

  notFound();
}

function MasterDataShell({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <Button asChild variant="secondary">
        <Link href="/bolle-ddt/anagrafiche">Torna alle anagrafiche</Link>
      </Button>
      <Card>
        <CardHeader>
          <h2 className="font-semibold">Dati anagrafici</h2>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
