import Link from "next/link";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  createBusinessPartnerAction,
  createDdtDestinationAction,
} from "@/app/(app)/bolle-ddt/actions";
import { getDeliveryMasterData } from "@/lib/warehouse/queries";

export default async function DeliveryMasterDataPage() {
  const { suppliers, customers, destinations } = await getDeliveryMasterData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anagrafiche Bolle / DDT"
        subtitle="Fornitori per bolle in ingresso, destinatari e destinazioni ricorrenti per DDT."
      />
      <Button asChild variant="secondary">
        <Link href="/bolle-ddt">Torna a Bolle / DDT</Link>
      </Button>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="font-semibold">Nuova anagrafica</h2>
            <p className="text-sm text-muted-foreground">
              Usa un unico inserimento per soggetti che possono essere
              fornitori, destinatari DDT o entrambi.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createBusinessPartnerAction} className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-center gap-2 rounded-[8px] border border-border px-3 py-2 text-sm">
                  <input name="isSupplier" type="checkbox" />
                  Fornitore per bolle
                </label>
                <label className="flex items-center gap-2 rounded-[8px] border border-border px-3 py-2 text-sm">
                  <input name="isCustomer" type="checkbox" />
                  Destinatario DDT
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="businessName"
                  placeholder="Ragione sociale / Nome"
                  required
                />
                <input
                  className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="address"
                  placeholder="Indirizzo destinatario"
                />
                <input
                  className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="vatNumber"
                  placeholder="Partita IVA"
                />
                <input
                  className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="taxCode"
                  placeholder="Codice fiscale"
                />
                <input
                  className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="email"
                  placeholder="Email"
                  type="email"
                />
                <input
                  className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name="phone"
                  placeholder="Telefono"
                />
              </div>
              <textarea
                className="focus-ring min-h-20 w-full rounded-[8px] border border-input bg-background px-3 py-2"
                name="notes"
                placeholder="Note"
              />
              <Button type="submit">Salva anagrafica</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Nuova destinazione DDT</h2>
          </CardHeader>
          <CardContent>
            <form action={createDdtDestinationAction} className="space-y-3">
              <select
                className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
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
                name="name"
                placeholder="Nome destinazione"
                required
              />
              <input
                className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                name="address"
                placeholder="Indirizzo destinazione"
              />
              <textarea
                className="focus-ring min-h-20 w-full rounded-[8px] border border-input bg-background px-3 py-2"
                name="notes"
                placeholder="Note"
              />
              <Button type="submit">Salva destinazione</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Fornitori</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {suppliers.map((supplier) => (
              <div
                className="flex items-start justify-between gap-3 text-sm"
                key={supplier.id}
              >
                <p>
                  <span className="font-medium">{supplier.businessName}</span>
                  <span className="block text-muted-foreground">
                    {supplier.vatNumber ?? supplier.email ?? "-"}
                  </span>
                </p>
                <Button asChild variant="secondary">
                  <Link
                    href={`/bolle-ddt/anagrafiche/supplier/${supplier.id}/modifica`}
                  >
                    Modifica
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Destinatari</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {customers.map((customer) => (
              <div
                className="flex items-start justify-between gap-3 text-sm"
                key={customer.id}
              >
                <p>
                  <span className="font-medium">{customer.businessName}</span>
                  <span className="block text-muted-foreground">
                    {customer.address ?? customer.email ?? "-"}
                  </span>
                </p>
                <Button asChild variant="secondary">
                  <Link
                    href={`/bolle-ddt/anagrafiche/customer/${customer.id}/modifica`}
                  >
                    Modifica
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold">Destinazioni</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {destinations.map((destination) => (
              <div
                className="flex items-start justify-between gap-3 text-sm"
                key={destination.id}
              >
                <p>
                  <span className="font-medium">{destination.name}</span>
                  <span className="block text-muted-foreground">
                    {destination.customer?.businessName ?? "Generica"} -{" "}
                    {destination.address ?? "-"}
                  </span>
                </p>
                <Button asChild variant="secondary">
                  <Link
                    href={`/bolle-ddt/anagrafiche/destination/${destination.id}/modifica`}
                  >
                    Modifica
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
