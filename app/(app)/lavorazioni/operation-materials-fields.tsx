"use client";

import { useMemo, useState } from "react";

type ProductOption = {
  id: string;
  name: string;
  unit: string;
  stock: number;
};

type MaterialRow = {
  productMaterialId?: string | null;
  quantity?: string | null;
  unit?: string | null;
  note?: string | null;
};

type OperationMaterialsFieldsProps = {
  products: ProductOption[];
  defaultRows: MaterialRow[];
  reasonSuggestions: string[];
  defaultReason?: string | null;
  errorField?: string;
};

export function OperationMaterialsFields({
  products,
  defaultRows,
  reasonSuggestions,
  defaultReason,
  errorField
}: OperationMaterialsFieldsProps) {
  const initialRows =
    defaultRows.length > 0
      ? defaultRows.map((row) => ({
          productMaterialId: row.productMaterialId ?? "",
          quantity: row.quantity ? String(row.quantity).replace(".", ",") : "",
          unit: row.unit ?? "",
          note: row.note ?? ""
        }))
      : Array.from({ length: 4 }, () => ({
          productMaterialId: "",
          quantity: "",
          unit: "",
          note: ""
        }));

  const [rows, setRows] = useState(initialRows);
  const [reason, setReason] = useState(defaultReason ?? "");
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products]
  );

  function updateRow(
    index: number,
    patch: Partial<(typeof rows)[number]>
  ) {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;
        const next = { ...row, ...patch };
        if (patch.productMaterialId !== undefined) {
          const product = productsById.get(patch.productMaterialId);
          next.unit = product?.unit ?? "";
        }
        return next;
      })
    );
  }

  const productErrorClass =
    errorField === "products" ? "border-destructive ring-2 ring-destructive/20" : "border-border";
  const reasonErrorClass =
    errorField === "treatmentReason"
      ? "border-destructive ring-2 ring-destructive/20"
      : "border-input";

  return (
    <>
      <fieldset className={`space-y-3 rounded-[8px] border p-4 ${productErrorClass}`}>
        <legend className="px-1 text-sm font-semibold">Prodotti usati</legend>
        <p className="text-sm text-muted-foreground">
          Ogni riga genera uno scarico di magazzino. La quantità non può superare la giacenza residua.
        </p>
        {rows.map((row, index) => {
          const product = row.productMaterialId
            ? productsById.get(row.productMaterialId)
            : null;
          return (
            <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr_2fr]" key={index}>
              <div>
                <select
                  className="focus-ring h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  name={`products.${index}.productMaterialId`}
                  value={row.productMaterialId}
                  onChange={(event) =>
                    updateRow(index, { productMaterialId: event.target.value })
                  }
                >
                  <option value="">Nessun prodotto</option>
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-muted-foreground">
                  {product
                    ? `Residuo magazzino: ${product.stock.toFixed(3).replace(".", ",")} ${product.unit}`
                    : "Seleziona un prodotto per vedere la giacenza."}
                </p>
              </div>
              <input
                className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
                inputMode="decimal"
                max={product ? product.stock : undefined}
                name={`products.${index}.quantity`}
                placeholder="Quantità"
                value={row.quantity}
                onChange={(event) => updateRow(index, { quantity: event.target.value })}
              />
              <input
                className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
                name={`products.${index}.unit`}
                placeholder="UM"
                value={row.unit}
                onChange={(event) => updateRow(index, { unit: event.target.value })}
              />
              <input
                className="focus-ring h-10 rounded-[8px] border border-input bg-background px-3"
                name={`products.${index}.note`}
                placeholder="Nota prodotto"
                value={row.note}
                onChange={(event) => updateRow(index, { note: event.target.value })}
              />
            </div>
          );
        })}
      </fieldset>

      <label className="block text-sm font-medium">
        Motivo trattamento
        <input
          className={`focus-ring mt-2 h-10 w-full rounded-[8px] border bg-background px-3 ${reasonErrorClass}`}
          list="operation-reasons"
          name="treatmentReason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <datalist id="operation-reasons">
          {reasonSuggestions.map((item) => (
            <option key={item} value={item} />
          ))}
        </datalist>
      </label>
    </>
  );
}
