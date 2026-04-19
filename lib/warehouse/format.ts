import { Prisma, WarehouseMovementSource, WarehouseMovementType } from "@prisma/client";

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("it-IT").format(value);
}

export function formatDateTime(value: Date | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(value);
}

export function formatDecimal(
  value: Prisma.Decimal | number | string | null | undefined,
  maximumFractionDigits = 3
) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("it-IT", {
    maximumFractionDigits
  }).format(Number(value));
}

export function formatMovementType(type: WarehouseMovementType) {
  const labels: Record<WarehouseMovementType, string> = {
    IN: "Ingresso",
    OUT: "Uscita",
    ADJUSTMENT: "Rettifica"
  };
  return labels[type];
}

export function formatMovementSource(source: WarehouseMovementSource) {
  const labels: Record<WarehouseMovementSource, string> = {
    INBOUND_DDT: "Bolla ingresso legacy",
    OPERATION: "Lavorazione legacy",
    MANUAL_ADJUSTMENT: "Rettifica legacy",
    OPENING_BALANCE: "Saldo iniziale",
    BOLLA_IN: "Bolla ingresso",
    LAVORAZIONE_OUT: "Lavorazione",
    DDT_OUT: "DDT uscita",
    RETTIFICA_ADMIN: "Rettifica admin",
    ALTRO: "Altro"
  };
  return labels[source];
}
