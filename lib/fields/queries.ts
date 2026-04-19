import { prisma } from "@/lib/prisma";

export async function getFieldsForList() {
  return prisma.field.findMany({
    where: { deletedAt: null },
    include: {
      usageHistory: {
        orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
        take: 1
      },
      pacHistory: {
        orderBy: [{ year: "desc" }, { updatedAt: "desc" }],
        take: 1
      }
    },
    orderBy: [
      { municipality: "asc" },
      { cadastralSheet: "asc" },
      { cadastralParcel: "asc" }
    ]
  });
}

export async function getFieldDetail(id: string) {
  return prisma.field.findFirst({
    where: { id, deletedAt: null },
    include: {
      usageHistory: {
        orderBy: [{ year: "desc" }, { updatedAt: "desc" }]
      },
      pacHistory: {
        orderBy: [{ year: "desc" }, { updatedAt: "desc" }]
      }
    }
  });
}
