import { Prisma } from "@prisma/client";

export function formatCurrency(
  value: Prisma.Decimal | number | string | null | undefined,
) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(Number(value));
}

export function formatFinanceDate(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("it-IT").format(value);
}
