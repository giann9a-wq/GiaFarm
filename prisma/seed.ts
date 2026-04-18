import { PrismaClient, RoleCode, CampaignStatus, OperationCategory } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { code: RoleCode.ADMIN },
    update: {},
    create: {
      code: RoleCode.ADMIN,
      name: "Admin",
      description: "Accesso completo a configurazioni, utenti e rettifiche critiche."
    }
  });

  await prisma.role.upsert({
    where: { code: RoleCode.USER },
    update: {},
    create: {
      code: RoleCode.USER,
      name: "User",
      description: "Accesso operativo ai moduli gestionali consentiti."
    }
  });

  await prisma.authorizedEmail.upsert({
    where: { email: "admin@giafarm.local" },
    update: {},
    create: {
      email: "admin@giafarm.local",
      roleCode: RoleCode.ADMIN,
      note: "Sostituire con l'email Google dell'amministratore reale."
    }
  });

  await prisma.user.upsert({
    where: { email: "admin@giafarm.local" },
    update: {
      roles: { set: [{ id: adminRole.id }] }
    },
    create: {
      email: "admin@giafarm.local",
      name: "Admin GiaFarm",
      roles: { connect: [{ id: adminRole.id }] }
    }
  });

  const campaign = await prisma.campaign.upsert({
    where: { name: "Campagna 2025/26" },
    update: {},
    create: {
      name: "Campagna 2025/26",
      startYear: 2025,
      endYear: 2026,
      startsOn: new Date("2025-11-01T00:00:00.000Z"),
      endsOn: new Date("2026-10-31T23:59:59.000Z"),
      status: CampaignStatus.ACTIVE
    }
  });

  const crop = await prisma.crop.upsert({
    where: { name: "Mais granella" },
    update: {},
    create: {
      name: "Mais granella",
      variety: "Demo",
      notes: "Coltura demo per seed iniziale."
    }
  });

  const northField = await prisma.field.upsert({
    where: { cadastralSheet_cadastralParcel: { cadastralSheet: "12", cadastralParcel: "145" } },
    update: {},
    create: {
      commonName: "Campo Nord",
      cadastralSheet: "12",
      cadastralParcel: "145",
      cadastralAreaHa: 2.42,
      cultivatedAreaHa: 2.31,
      latitude: 45.6512345,
      longitude: 9.4678901,
      geoNotes: "Coordinate indicative demo, sostituire con rilievo reale."
    }
  });

  const southField = await prisma.field.upsert({
    where: { cadastralSheet_cadastralParcel: { cadastralSheet: "13", cadastralParcel: "88" } },
    update: {},
    create: {
      commonName: "Campo Sud",
      cadastralSheet: "13",
      cadastralParcel: "88",
      cadastralAreaHa: 1.76,
      cultivatedAreaHa: 1.7,
      latitude: 45.6478123,
      longitude: 9.4712456,
      geoNotes: "Coordinate indicative demo, sostituire con rilievo reale."
    }
  });

  await prisma.fieldPacHistory.createMany({
    data: [
      { fieldId: northField.id, year: 2025, included: true },
      { fieldId: northField.id, year: 2026, included: true },
      { fieldId: southField.id, year: 2025, included: false },
      { fieldId: southField.id, year: 2026, included: true }
    ],
    skipDuplicates: true
  });

  const group = await prisma.fieldGroup.upsert({
    where: { campaignId_name: { campaignId: campaign.id, name: "Mais Cornate" } },
    update: {},
    create: {
      name: "Mais Cornate",
      campaignId: campaign.id,
      cropId: crop.id,
      notes: "Gruppo campi demo modificabile per campagna."
    }
  });

  await prisma.fieldGroupMembership.createMany({
    data: [
      { fieldId: northField.id, fieldGroupId: group.id, areaHa: 2.31 },
      { fieldId: southField.id, fieldGroupId: group.id, areaHa: 1.7 }
    ],
    skipDuplicates: true
  });

  const operationTypes = [
    ["Semina", OperationCategory.SOWING],
    ["Raccolta", OperationCategory.HARVEST],
    ["Erpicatura", OperationCategory.SOIL_PREPARATION],
    ["Trattamento fitosanitario", OperationCategory.TREATMENT],
    ["Irrigazione", OperationCategory.IRRIGATION]
  ] as const;

  for (const [name, category] of operationTypes) {
    await prisma.operationType.upsert({
      where: { name },
      update: {},
      create: { name, category }
    });
  }

  const seedProduct = await prisma.productMaterial.upsert({
    where: { name: "Semente mais demo" },
    update: {},
    create: {
      name: "Semente mais demo",
      category: "Semente",
      unit: "kg",
      notes: "Materiale demo per magazzino e lavorazioni."
    }
  });

  await prisma.supplier.upsert({
    where: { id: "supplier-demo" },
    update: {},
    create: {
      id: "supplier-demo",
      businessName: "Fornitore Agricolo Demo",
      email: "fornitore@example.com"
    }
  });

  await prisma.customer.upsert({
    where: { id: "customer-demo" },
    update: {},
    create: {
      id: "customer-demo",
      businessName: "Cliente Cereali Demo",
      email: "cliente@example.com"
    }
  });

  const sowingType = await prisma.operationType.findUniqueOrThrow({ where: { name: "Semina" } });
  const operation = await prisma.operation.create({
    data: {
      campaignId: campaign.id,
      operationTypeId: sowingType.id,
      performedOn: new Date("2026-03-28T08:30:00.000Z"),
      productMaterialId: seedProduct.id,
      quantity: 92,
      quantityUnit: "kg",
      treatedAreaHa: 4.01,
      treatmentReason: "Semina primaverile",
      notes: "Record demo generato dal seed.",
      fieldGroups: {
        create: [{ fieldGroupId: group.id }]
      },
      calendarEvents: {
        create: {
          title: "Semina Mais Cornate",
          startsAt: new Date("2026-03-28T08:30:00.000Z"),
          source: "SYSTEM"
        }
      }
    }
  });

  await prisma.warehouseMovement.create({
    data: {
      productMaterialId: seedProduct.id,
      movementType: "OUT",
      source: "OPERATION",
      sourceId: operation.id,
      operationId: operation.id,
      quantity: 92,
      unit: "kg",
      movedOn: new Date("2026-03-28T08:30:00.000Z"),
      note: "Scarico demo da lavorazione."
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
