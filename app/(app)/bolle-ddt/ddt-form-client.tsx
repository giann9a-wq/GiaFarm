"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type DdtAction = (formData: FormData) => Promise<void>;

type CustomerOption = {
  id: string;
  businessName: string;
  address?: string | null;
  destinations: {
    id: string;
    name: string;
    address?: string | null;
  }[];
};

type ProductOption = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

type UnitOption = {
  id: string;
  code: string;
};

type DdtRowState = {
  productMaterialId: string;
  description: string;
  quantity: string;
  unit: string;
  lot: string;
  notes: string;
};

type DdtFormClientProps = {
  action: DdtAction;
  defaultKind: "WAREHOUSE" | "FREE_TEXT";
  defaultIssuedOn?: string;
  defaultCustomerId?: string;
  defaultCustomerName?: string;
  defaultDestinationName?: string;
  defaultDestinationAddress?: string;
  defaultTransportReason?: string;
  defaultPackageAppearance?: string;
  defaultPackageCount?: string;
  defaultTransportedBy?: string;
  defaultTransportStartsAt?: string;
  defaultDriverSignature?: string;
  defaultRecipientSignature?: string;
  defaultNotes?: string;
  defaultRows: DdtRowState[];
  customers: CustomerOption[];
  products: ProductOption[];
  units: UnitOption[];
  fieldProductSuggestions: string[];
  submitLabel: string;
};

function emptyRow(): DdtRowState {
  return {
    productMaterialId: "",
    description: "",
    quantity: "",
    unit: "",
    lot: "",
    notes: ""
  };
}

function formatQuantity(value: number) {
  return value > 0 ? value.toFixed(3).replace(".", ",") : "";
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return map[char] ?? char;
  });
}

export function DdtFormClient({
  action,
  defaultKind,
  defaultIssuedOn,
  defaultCustomerId,
  defaultCustomerName,
  defaultDestinationName,
  defaultDestinationAddress,
  defaultTransportReason,
  defaultPackageAppearance,
  defaultPackageCount,
  defaultTransportedBy,
  defaultTransportStartsAt,
  defaultDriverSignature,
  defaultRecipientSignature,
  defaultNotes,
  defaultRows,
  customers,
  products,
  units,
  fieldProductSuggestions,
  submitLabel
}: DdtFormClientProps) {
  const [kind, setKind] = useState(defaultKind);
  const [customerId, setCustomerId] = useState(defaultCustomerId ?? "");
  const [destinationName, setDestinationName] = useState(defaultDestinationName ?? "");
  const [destinationAddress, setDestinationAddress] = useState(defaultDestinationAddress ?? "");
  const [destinationChoice, setDestinationChoice] = useState("");
  const [rows, setRows] = useState<DdtRowState[]>(
    defaultRows.length > 0 ? defaultRows : Array.from({ length: 5 }, emptyRow)
  );

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );
  const selectedCustomer = customers.find((customer) => customer.id === customerId);
  const customerDestinations = selectedCustomer?.destinations ?? [];

  function updateCustomer(nextCustomerId: string) {
    setCustomerId(nextCustomerId);
    const customer = customers.find((item) => item.id === nextCustomerId);
    const destinations = customer?.destinations ?? [];
    if (destinations.length === 1) {
      setDestinationChoice(destinations[0].id);
      setDestinationName(destinations[0].name);
      setDestinationAddress(destinations[0].address ?? "");
    } else if (destinations.length === 0) {
      setDestinationChoice("");
      setDestinationName("");
      setDestinationAddress(customer?.address ?? "");
    } else {
      setDestinationChoice("");
      setDestinationName("");
      setDestinationAddress("");
    }
  }

  function updateDestination(destinationId: string) {
    setDestinationChoice(destinationId);
    const destination = customerDestinations.find((item) => item.id === destinationId);
    if (!destination) return;
    setDestinationName(destination.name);
    setDestinationAddress(destination.address ?? "");
  }

  function updateKind(nextKind: "WAREHOUSE" | "FREE_TEXT") {
    setKind(nextKind);
    if (nextKind === "FREE_TEXT") {
      setRows((current) =>
        current.map((row) => ({ ...row, productMaterialId: "" }))
      );
    }
  }

  function updateRow(index: number, patch: Partial<DdtRowState>) {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row, ...patch };
        if (patch.productMaterialId !== undefined) {
          const product = productsById.get(patch.productMaterialId);
          next.description = product?.name ?? "";
          next.unit = product?.unit ?? "";
          next.quantity = product ? formatQuantity(product.stock) : "";
        }
        return next;
      })
    );
  }

  function openPreview() {
    const form = document.querySelector<HTMLFormElement>("#ddt-form");
    const data = form ? new FormData(form) : null;
    const get = (key: string) => String(data?.get(key) ?? "");
    const previewRows = rows.filter((row) => row.description || row.quantity || row.productMaterialId);
    const html = `<!doctype html>
      <html>
        <head>
          <title>Anteprima DDT</title>
          <style>
            @page { size: A4; margin: 14mm; }
            body { font-family: Arial, sans-serif; color: #111; font-size: 12px; }
            .head { display: flex; justify-content: space-between; border-bottom: 1px solid #111; padding-bottom: 12px; }
            h1 { font-size: 18px; margin: 0; }
            h2 { font-size: 16px; margin: 0 0 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
            .box { border: 1px solid #111; padding: 8px; min-height: 55px; }
            table { width: 100%; border-collapse: collapse; margin-top: 14px; }
            th, td { border: 1px solid #111; padding: 6px; text-align: left; }
            .meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 14px; }
            .sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 22px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()">Stampa / salva PDF</button>
          <div class="head">
            <div><h1>GiaFarm</h1><p>Azienda agricola</p></div>
            <div><h2>DOCUMENTO DI TRASPORTO</h2><p>Data ${escapeHtml(get("issuedOn"))}</p><p>${kind === "WAREHOUSE" ? "Da Magazzino" : "Da campo"}</p></div>
          </div>
          <div class="grid">
            <div class="box"><strong>Destinatario</strong><br>${escapeHtml(selectedCustomer?.businessName || get("customerName") || "Non indicato")}</div>
            <div class="box"><strong>Destinazione</strong><br>${escapeHtml(destinationName || "-")}<br>${escapeHtml(destinationAddress || "")}</div>
          </div>
          <div class="meta">
            <div><strong>Causale</strong><br>${escapeHtml(get("transportReason"))}</div>
            <div><strong>Aspetto</strong><br>${escapeHtml(get("packageAppearance"))}</div>
            <div><strong>Colli</strong><br>${escapeHtml(get("packageCount"))}</div>
            <div><strong>Mezzo</strong><br>${escapeHtml(get("transportedBy"))}</div>
          </div>
          <table>
            <thead><tr><th>Art.</th><th>Descrizione</th><th>Quantita</th><th>UM</th><th>Lotto</th></tr></thead>
            <tbody>
              ${previewRows
                .map(
                  (row, index) =>
                    `<tr><td>${index + 1}</td><td>${escapeHtml(row.description)}</td><td>${escapeHtml(row.quantity)}</td><td>${escapeHtml(row.unit)}</td><td>${escapeHtml(row.lot)}</td></tr>`
                )
                .join("")}
            </tbody>
          </table>
          <div class="sign">
            <div><strong>Data/ora trasporto</strong><br>${escapeHtml(get("transportStartsAt"))}</div>
            <div><strong>Firma conducente</strong><br>${escapeHtml(get("driverSignature"))}</div>
            <div><strong>Firma destinatario</strong><br>${escapeHtml(get("recipientSignature"))}</div>
          </div>
        </body>
      </html>`;
    const preview = window.open("", "_blank", "width=900,height=1200");
    preview?.document.write(html);
    preview?.document.close();
  }

  return (
    <form
      action={action}
      className="space-y-6 rounded-[8px] border border-border bg-card p-5"
      id="ddt-form"
    >
      <div className="grid gap-4 lg:grid-cols-4">
        <label className="text-sm font-medium">
          Tipo DDT
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="kind"
            required
            value={kind}
            onChange={(event) => updateKind(event.target.value as "WAREHOUSE" | "FREE_TEXT")}
          >
            <option value="WAREHOUSE">Da Magazzino</option>
            <option value="FREE_TEXT">Da campo</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Data documento
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultIssuedOn}
            name="issuedOn"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Destinatario esistente
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="customerId"
            value={customerId}
            onChange={(event) => updateCustomer(event.target.value)}
          >
            <option value="">Nuovo / non indicato</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.businessName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Nuovo destinatario
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultCustomerName}
            name="customerName"
          />
        </label>
      </div>
      <Button asChild variant="secondary">
        <Link href="/bolle-ddt/anagrafiche">Nuova anagrafica</Link>
      </Button>

      <div className="grid gap-4 lg:grid-cols-3">
        {customerDestinations.length > 1 ? (
          <label className="text-sm font-medium">
            Destinazioni disponibili
            <select
              className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
              value={destinationChoice}
              onChange={(event) => updateDestination(event.target.value)}
            >
              <option value="">Seleziona destinazione</option>
              {customerDestinations.map((destination) => (
                <option key={destination.id} value={destination.id}>
                  {destination.name}
                  {destination.address ? ` - ${destination.address}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="text-sm font-medium">
          Destinazione
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="destinationName"
            value={destinationName}
            onChange={(event) => setDestinationName(event.target.value)}
          />
        </label>
        <label className="text-sm font-medium lg:col-span-2">
          Indirizzo destinazione
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            name="destinationAddress"
            value={destinationAddress}
            onChange={(event) => setDestinationAddress(event.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <label className="text-sm font-medium">
          Causale
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultTransportReason}
            name="transportReason"
            placeholder="Reso, vendita, trasporto raccolto"
          />
        </label>
        <label className="text-sm font-medium">
          Aspetto esteriore
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultPackageAppearance}
            name="packageAppearance"
          />
        </label>
        <label className="text-sm font-medium">
          Numero colli
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultPackageCount}
            name="packageCount"
          />
        </label>
        <label className="text-sm font-medium">
          Trasporto a mezzo
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultTransportedBy}
            name="transportedBy"
          >
            <option value="">Seleziona</option>
            <option value="mittente">Mittente</option>
            <option value="destinatario">Destinatario</option>
            <option value="vettore">Vettore</option>
          </select>
        </label>
        <label className="text-sm font-medium">
          Data/ora trasporto
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultTransportStartsAt}
            name="transportStartsAt"
            type="datetime-local"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-3 text-left">{kind === "WAREHOUSE" ? "Materiale magazzino" : "Prodotto da campo"}</th>
              <th className="px-3 py-3 text-left">Quantita</th>
              <th className="px-3 py-3 text-left">UM</th>
              <th className="px-3 py-3 text-left">Lotto</th>
              <th className="px-3 py-3 text-left">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row, index) => {
              const product = row.productMaterialId ? productsById.get(row.productMaterialId) : null;
              return (
                <tr key={index}>
                  <td className="px-3 py-2">
                    {kind === "WAREHOUSE" ? (
                      <>
                        <select
                          className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                          name={`rows.${index}.productMaterialId`}
                          value={row.productMaterialId}
                          onChange={(event) => updateRow(index, { productMaterialId: event.target.value })}
                        >
                          <option value="">Nessuno</option>
                          {products.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                        <input type="hidden" name={`rows.${index}.description`} value={row.description} />
                        <p className="mt-1 text-xs text-muted-foreground">
                          {product
                            ? `Residuo: ${formatQuantity(product.stock)} ${product.unit}`
                            : "Seleziona un prodotto di magazzino."}
                        </p>
                      </>
                    ) : (
                      <input
                        className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                        list="ddt-field-products"
                        name={`rows.${index}.description`}
                        value={row.description}
                        onChange={(event) => updateRow(index, { description: event.target.value })}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="focus-ring h-10 w-28 rounded-[8px] border border-input bg-background px-3"
                      inputMode="decimal"
                      name={`rows.${index}.quantity`}
                      value={row.quantity}
                      onChange={(event) => updateRow(index, { quantity: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="focus-ring h-10 w-20 rounded-[8px] border border-input bg-background px-3"
                      list="ddt-units"
                      name={`rows.${index}.unit`}
                      value={row.unit}
                      onChange={(event) => updateRow(index, { unit: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="focus-ring h-10 w-28 rounded-[8px] border border-input bg-background px-3"
                      name={`rows.${index}.lot`}
                      value={row.lot}
                      onChange={(event) => updateRow(index, { lot: event.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                      name={`rows.${index}.notes`}
                      value={row.notes}
                      onChange={(event) => updateRow(index, { notes: event.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <datalist id="ddt-units">
          {units.map((unit) => (
            <option key={unit.id} value={unit.code} />
          ))}
        </datalist>
        <datalist id="ddt-field-products">
          {fieldProductSuggestions.map((description) => (
            <option key={description} value={description} />
          ))}
        </datalist>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Firma conducente
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultDriverSignature}
            name="driverSignature"
          />
        </label>
        <label className="text-sm font-medium">
          Firma destinatario
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={defaultRecipientSignature}
            name="recipientSignature"
          />
        </label>
      </div>

      <label className="block text-sm font-medium">
        Note
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          defaultValue={defaultNotes}
          name="notes"
        />
      </label>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={openPreview}>
          Vedi anteprima
        </Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
