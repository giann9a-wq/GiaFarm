import { OperationCategory, Prisma } from "@prisma/client";

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("it-IT").format(value);
}

export function formatDecimal(
  value: Prisma.Decimal | number | string | null | undefined,
  maximumFractionDigits = 3
) {
  if (value === null || value === undefined) return "-";
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits
  }).format(Number(value));
}

export function formatCategory(category: OperationCategory) {
  const labels: Record<OperationCategory, string> = {
    SOWING: "Semina",
    HARVEST: "Raccolta",
    SOIL_PREPARATION: "Preparazione terreno",
    TREATMENT: "Trattamento",
    IRRIGATION: "Irrigazione",
    OTHER: "Altro"
  };
  return labels[category];
}

export function formatCampaignLabel(startYear: number, endYear: number) {
  return `${startYear}/${String(endYear).slice(-2)}`;
}
