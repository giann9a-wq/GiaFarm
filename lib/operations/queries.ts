import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OperationFilters = {
  campaignId?: string;
  fieldGroupId?: string;
  fieldId?: string;
  operationTypeId?: string;
  from?: string;
  to?: string;
};

export async function getOperationsFiltersData() {
  const [campaigns, groups, fields, operationTypes, products, crops] = await Promise.all([
    prisma.campaign.findMany({ orderBy: { startsOn: "desc" } }),
    prisma.fieldGroup.findMany({
      include: { campaign: true, crop: true, memberships: { include: { field: true } } },
      orderBy: [{ campaign: { startsOn: "desc" } }, { name: "asc" }]
    }),
    prisma.field.findMany({
      where: { deletedAt: null },
      orderBy: [{ municipality: "asc" }, { cadastralSheet: "asc" }, { cadastralParcel: "asc" }]
    }),
    prisma.operationType.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.productMaterial.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.crop.findMany({ orderBy: { name: "asc" } })
  ]);

  return { campaigns, groups, fields, operationTypes, products, crops };
}

export async function getOperationsList(filters: OperationFilters) {
  const where: Prisma.OperationWhereInput = {};

  if (filters.campaignId) where.campaignId = filters.campaignId;
  if (filters.operationTypeId) where.operationTypeId = filters.operationTypeId;
  if (filters.fieldGroupId) {
    where.fieldGroups = { some: { fieldGroupId: filters.fieldGroupId } };
  }
  if (filters.fieldId) {
    where.OR = [
      { fields: { some: { fieldId: filters.fieldId } } },
      {
        fieldGroups: {
          some: {
            fieldGroup: {
              memberships: { some: { fieldId: filters.fieldId } }
            }
          }
        }
      }
    ];
  }
  if (filters.from || filters.to) {
    where.performedOn = {
      ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
      ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {})
    };
  }

  return prisma.operation.findMany({
    where,
    include: {
      campaign: true,
      operationType: true,
      productMaterial: true,
      fieldGroups: { include: { fieldGroup: { include: { crop: true } } } },
      fields: { include: { field: true } },
      attachments: { include: { driveFile: true } }
    },
    orderBy: [{ performedOn: "desc" }, { createdAt: "desc" }]
  });
}

export async function getOperationDetail(id: string) {
  return prisma.operation.findUnique({
    where: { id },
    include: {
      campaign: true,
      operationType: true,
      productMaterial: true,
      fieldGroups: {
        include: {
          fieldGroup: {
            include: {
              crop: true,
              memberships: { include: { field: true } }
            }
          }
        }
      },
      fields: { include: { field: true } },
      attachments: { include: { driveFile: true } }
    }
  });
}

export async function getFieldGroupsList(campaignId?: string) {
  return prisma.fieldGroup.findMany({
    where: campaignId ? { campaignId } : undefined,
    include: {
      campaign: true,
      crop: true,
      memberships: { include: { field: { include: { usageHistory: true } } } }
    },
    orderBy: [{ campaign: { startsOn: "desc" } }, { name: "asc" }]
  });
}
