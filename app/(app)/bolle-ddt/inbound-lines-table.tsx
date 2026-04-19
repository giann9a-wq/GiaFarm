"use client";

import { useState } from "react";

function parseDecimal(value: string) {
  const normalized = value.trim().replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatDecimal(value: number) {
  if (!value) return "";
  return value.toFixed(2).replace(".", ",");
}

export function InboundLinesTable({ units }: { units: { id: string; code: string }[] }) {
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  function updateAmount(index: number) {
    const quantityInput = document.querySelector<HTMLInputElement>(
      `input[name="rows.${index}.quantity"]`
    );
    const priceInput = document.querySelector<HTMLInputElement>(
      `input[name="rows.${index}.unitPrice"]`
    );
    const quantity = parseDecimal(quantityInput?.value ?? "");
    const price = parseDecimal(priceInput?.value ?? "");
    setAmounts((current) => ({ ...current, [index]: formatDecimal(quantity * price) }));
  }

  return (
    <div className="overflow-x-auto rounded-[8px] border border-border">
      <table className="min-w-[980px] w-full text-sm">
        <thead className="bg-muted text-xs uppercase text-muted-foreground">
          <tr>
            <th className="px-3 py-3 text-left">Cod. Articolo</th>
            <th className="px-3 py-3 text-left">Descrizione</th>
            <th className="px-3 py-3 text-left">Nr. Reg.</th>
            <th className="px-3 py-3 text-left">UM</th>
            <th className="px-3 py-3 text-left">Quantita</th>
            <th className="px-3 py-3 text-left">Prezzo</th>
            <th className="px-3 py-3 text-left">Importo riga</th>
            <th className="px-3 py-3 text-left">C.I.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: 5 }, (_, index) => (
            <tr key={index}>
              <td className="px-3 py-2">
                <input className="focus-ring h-10 w-32 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.articleCode`} />
              </td>
              <td className="px-3 py-2">
                <input className="focus-ring h-10 w-64 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.description`} />
              </td>
              <td className="px-3 py-2">
                <input className="focus-ring h-10 w-24 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.registrationNumber`} />
              </td>
              <td className="px-3 py-2">
                <input className="focus-ring h-10 w-20 rounded-[8px] border border-input bg-background px-3" list="units" name={`rows.${index}.unit`} />
              </td>
              <td className="px-3 py-2">
                <input
                  className="focus-ring h-10 w-24 rounded-[8px] border border-input bg-background px-3"
                  inputMode="decimal"
                  name={`rows.${index}.quantity`}
                  onChange={() => updateAmount(index)}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  className="focus-ring h-10 w-24 rounded-[8px] border border-input bg-background px-3"
                  inputMode="decimal"
                  name={`rows.${index}.unitPrice`}
                  onChange={() => updateAmount(index)}
                />
              </td>
              <td className="px-3 py-2">
                <input
                  className="focus-ring h-10 w-28 rounded-[8px] border border-input bg-background px-3"
                  inputMode="decimal"
                  name={`rows.${index}.lineAmount`}
                  onChange={(event) =>
                    setAmounts((current) => ({ ...current, [index]: event.target.value }))
                  }
                  value={amounts[index] ?? ""}
                />
              </td>
              <td className="px-3 py-2">
                <input className="focus-ring h-10 w-16 rounded-[8px] border border-input bg-background px-3" name={`rows.${index}.ciCode`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <datalist id="units">
        {units.map((unit) => <option key={unit.id} value={unit.code} />)}
      </datalist>
    </div>
  );
}
