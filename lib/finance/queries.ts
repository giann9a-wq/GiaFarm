import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type FinanceFilters = {
  campaignId?: string;
  fieldGroupId?: string;
  from?: string;
  to?: string;
};

function dateRange(filters: FinanceFilters) {
  if (!filters.from && !filters.to) return undefined;
  return {
    ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
    ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
  };
}

export async function getFinanceBaseData() {
  const [campaigns, fieldGroups, suppliers, customers] = await Promise.all([
    prisma.campaign.findMany({ orderBy: [{ startYear: "desc" }] }),
    prisma.fieldGroup.findMany({
      include: { campaign: true, crop: true },
      orderBy: [{ campaign: { startYear: "desc" } }, { name: "asc" }],
    }),
    prisma.supplier.findMany({ orderBy: { businessName: "asc" } }),
    prisma.customer.findMany({ orderBy: { businessName: "asc" } }),
  ]);

  return { campaigns, fieldGroups, suppliers, customers };
}

export async function getFinanceCosts(filters: FinanceFilters = {}) {
  return prisma.financeCost.findMany({
    where: {
      ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
      ...(dateRange(filters) ? { occurredOn: dateRange(filters) } : {}),
      ...(filters.fieldGroupId
        ? { allocations: { some: { fieldGroupId: filters.fieldGroupId } } }
        : {}),
    },
    include: {
      supplier: true,
      campaign: true,
      driveFile: true,
      allocations: { include: { fieldGroup: true } },
    },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
  });
}

export async function getFinanceCost(id: string) {
  return prisma.financeCost.findUnique({
    where: { id },
    include: {
      supplier: true,
      campaign: true,
      driveFile: true,
      allocations: {
        include: { fieldGroup: { include: { campaign: true, crop: true } } },
      },
    },
  });
}

export async function getFinanceRevenues(filters: FinanceFilters = {}) {
  return prisma.financeRevenue.findMany({
    where: {
      ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
      ...(dateRange(filters) ? { occurredOn: dateRange(filters) } : {}),
      ...(filters.fieldGroupId
        ? { allocations: { some: { fieldGroupId: filters.fieldGroupId } } }
        : {}),
    },
    include: {
      customer: true,
      campaign: true,
      driveFile: true,
      allocations: { include: { fieldGroup: true } },
    },
    orderBy: [{ occurredOn: "desc" }, { createdAt: "desc" }],
  });
}

export async function getFinanceRevenue(id: string) {
  return prisma.financeRevenue.findUnique({
    where: { id },
    include: {
      customer: true,
      campaign: true,
      driveFile: true,
      allocations: {
        include: { fieldGroup: { include: { campaign: true, crop: true } } },
      },
    },
  });
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined) {
  return value === null || value === undefined ? 0 : Number(value);
}

export async function getFinanceDashboard(filters: FinanceFilters = {}) {
  const [campaigns, groups, costs, revenues] = await Promise.all([
    prisma.campaign.findMany({ orderBy: [{ startYear: "desc" }] }),
    prisma.fieldGroup.findMany({
      include: { campaign: true, crop: true },
      orderBy: [{ campaign: { startYear: "desc" } }, { name: "asc" }],
    }),
    getFinanceCosts(filters),
    getFinanceRevenues(filters),
  ]);

  const campaignMap = new Map<
    string,
    { label: string; costs: number; revenues: number }
  >();
  for (const campaign of campaigns) {
    campaignMap.set(campaign.id, {
      label: campaign.name,
      costs: 0,
      revenues: 0,
    });
  }

  for (const cost of costs) {
    if (!cost.campaignId) continue;
    const bucket = campaignMap.get(cost.campaignId);
    if (bucket) bucket.costs += decimalToNumber(cost.amount);
  }

  for (const revenue of revenues) {
    if (!revenue.campaignId) continue;
    const bucket = campaignMap.get(revenue.campaignId);
    if (bucket) bucket.revenues += decimalToNumber(revenue.amount);
  }

  const groupMap = new Map<
    string,
    { label: string; campaign: string; costs: number; revenues: number }
  >();
  for (const group of groups) {
    if (filters.campaignId && group.campaignId !== filters.campaignId) continue;
    groupMap.set(group.id, {
      label: group.name,
      campaign: group.campaign.name,
      costs: 0,
      revenues: 0,
    });
  }

  for (const cost of costs) {
    for (const allocation of cost.allocations) {
      const bucket = groupMap.get(allocation.fieldGroupId);
      if (bucket) bucket.costs += decimalToNumber(allocation.amount);
    }
  }

  for (const revenue of revenues) {
    for (const allocation of revenue.allocations) {
      const bucket = groupMap.get(allocation.fieldGroupId);
      if (bucket) bucket.revenues += decimalToNumber(allocation.amount);
    }
  }

  const periodSummary = {
    totalCosts: costs.reduce(
      (sum, item) => sum + decimalToNumber(item.amount),
      0,
    ),
    totalRevenues: revenues.reduce(
      (sum, item) => sum + decimalToNumber(item.amount),
      0,
    ),
  };

  return {
    campaigns: Array.from(campaignMap.entries()).map(([id, value]) => ({
      id,
      ...value,
      margin: value.revenues - value.costs,
    })),
    groups: Array.from(groupMap.entries()).map(([id, value]) => ({
      id,
      ...value,
      margin: value.revenues - value.costs,
    })),
    periodSummary: {
      ...periodSummary,
      margin: periodSummary.totalRevenues - periodSummary.totalCosts,
    },
  };
}
