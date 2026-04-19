import { Prisma } from "@prisma/client";

export function formatSqm(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) return "n.d.";
  const numberValue = Number(value);
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numberValue);
}

export function formatPac(value: boolean | null | undefined) {
  if (value === true) return "Si";
  if (value === false) return "No";
  return "Non definito";
}
