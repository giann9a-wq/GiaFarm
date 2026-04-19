import { PrismaClient, RoleCode, CampaignStatus, OperationCategory } from "@prisma/client";

const prisma = new PrismaClient();

const initialFieldYear = 2026;
const initialFields = [
  ["BUSNAGO", "1", "67", "10130.00", "9499.00"],
  ["CORNATE D'ADDA", "16", "179", "7670.00", "7709.00"],
  ["CORNATE D'ADDA", "16", "180", "5810.00", "5791.00"],
  ["CORNATE D'ADDA", "16", "186", "3130.00", "3124.00"],
  ["CORNATE D'ADDA", "16", "204", "3810.00", "3699.00"],
  ["CORNATE D'ADDA", "16", "205", "3790.00", "3819.00"],
  ["CORNATE D'ADDA", "16", "206", "2680.00", "2682.00"],
  ["CORNATE D'ADDA", "16", "217", "12530.00", "11751.00"],
  ["CORNATE D'ADDA", "16", "219", "2990.00", "2984.00"],
  ["CORNATE D'ADDA", "16", "220", "29095.00", "28898.00"],
  ["CORNATE D'ADDA", "16", "254", "29450.00", "28951.00"],
  ["CORNATE D'ADDA", "5", "136", "3400.00", "3400.00"],
  ["CORNATE D'ADDA", "18", "143", "14957.00", "14870.00"],
  ["CORNATE D'ADDA", "19", "147", "8471.00", "8471.00"],
  ["CORNATE D'ADDA", "13", "109", "3103.00", "3103.00"],
  ["CORNATE D'ADDA", "5", "196", "169.00", "110.00"],
  ["CORNATE D'ADDA", "5", "202", "7641.00", "7641.00"],
  ["CORNATE D'ADDA", "16", "93", "2428.00", "2427.00"],
  ["CORNATE D'ADDA", "16", "99", "2358.00", "2358.00"],
  ["CORNATE D'ADDA", "16", "100", "2930.00", "2930.00"],
  ["CORNATE D'ADDA", "16", "101", "2834.00", "2834.00"],
  ["CORNATE D'ADDA", "16", "103", "13198.00", "13198.00"],
  ["CORNATE D'ADDA", "16", "141", "2118.00", "2118.00"],
  ["CORNATE D'ADDA", "16", "482", "8846.00", "8372.00"],
  ["CORNATE D'ADDA", "16", "490", "6398.00", "5798.00"],
  ["CORNATE D'ADDA", "16", "493", "15022.00", "14881.00"],
  ["CORNATE D'ADDA", "16", "494", "9770.00", "9566.00"],
  ["CORNATE D'ADDA", "16", "49", "9580.00", "8091.00"],
  ["CORNATE D'ADDA", "13", "298", "4808.00", "4808.00"],
  ["CORNATE D'ADDA", "19", "28", "6720.00", "6400.00"],
  ["CORNATE D'ADDA", "11", "576", "11880.00", "10500.00"],
  ["CORNATE D'ADDA", "11", "577", "3100.00", "2500.00"]
] as const;

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

  const seededFields = [];
  for (const [
    municipality,
    cadastralSheet,
    cadastralParcel,
    cadastralAreaSqm,
    usedAreaSqm
  ] of initialFields) {
    const field = await prisma.field.upsert({
      where: {
        municipality_cadastralSheet_cadastralParcel: {
          municipality,
          cadastralSheet,
          cadastralParcel
        }
      },
      update: {
        cadastralAreaSqm
      },
      create: {
        municipality,
        cadastralSheet,
        cadastralParcel,
        commonName: null,
        cadastralAreaSqm,
        notes: "Import iniziale anagrafica campi."
      }
    });

    await prisma.fieldUsageHistory.upsert({
      where: { fieldId_year: { fieldId: field.id, year: initialFieldYear } },
      update: {
        usedAreaSqm,
        note: "Import iniziale superficie utilizzata."
      },
      create: {
        fieldId: field.id,
        year: initialFieldYear,
        usedAreaSqm,
        note: "Import iniziale superficie utilizzata."
      }
    });

    await prisma.fieldPacHistory.upsert({
      where: { fieldId_year: { fieldId: field.id, year: initialFieldYear } },
      update: {
        included: null,
        note: "Import iniziale PAC: valore non definito."
      },
      create: {
        fieldId: field.id,
        year: initialFieldYear,
        included: null,
        note: "Import iniziale PAC: valore non definito."
      }
    });

    seededFields.push({ field, usedAreaSqm });
  }

  await prisma.field.updateMany({
    where: {
      municipality: "NON DEFINITO",
      commonName: { in: ["Campo Nord", "Campo Sud"] },
      deletedAt: null
    },
    data: {
      deletedAt: new Date(),
      notes: "Campo demo legacy nascosto dopo import campi reali."
    }
  });

  const group = await prisma.fieldGroup.upsert({
    where: { campaignId_name: { campaignId: campaign.id, name: "Mais Cornate" } },
    update: {
      startsOn: new Date("2026-03-01T00:00:00.000Z"),
      endsOn: new Date("2026-10-31T23:59:59.000Z")
    },
    create: {
      name: "Mais Cornate",
      campaignId: campaign.id,
      cropId: crop.id,
      startsOn: new Date("2026-03-01T00:00:00.000Z"),
      endsOn: new Date("2026-10-31T23:59:59.000Z"),
      notes: "Gruppo campi demo modificabile per campagna."
    }
  });

  await prisma.fieldGroupMembership.createMany({
    data: [
      {
        fieldId: seededFields[1].field.id,
        fieldGroupId: group.id,
        areaHa: Number(seededFields[1].usedAreaSqm) / 10000
      },
      {
        fieldId: seededFields[2].field.id,
        fieldGroupId: group.id,
        areaHa: Number(seededFields[2].usedAreaSqm) / 10000
      }
    ],
    skipDuplicates: true
  });

  await prisma.operationType.deleteMany({
    where: {
      name: { in: ["Semina", "Raccolta", "Trattamento fitosanitario", "Irrigazione"] },
      operations: { none: {} }
    }
  });

  const operationTypes = [
    ["Semina principale", OperationCategory.SOWING],
    ["Seconda semina", OperationCategory.SOWING],
    ["Raccolta coltura", OperationCategory.HARVEST],
    ["Aratura", OperationCategory.SOIL_PREPARATION],
    ["Erpicatura", OperationCategory.SOIL_PREPARATION],
    ["Ripuntatura", OperationCategory.SOIL_PREPARATION],
    ["Fresatura", OperationCategory.SOIL_PREPARATION],
    ["Rullatura", OperationCategory.SOIL_PREPARATION],
    ["Irrigazione meccanica", OperationCategory.IRRIGATION],
    ["Diserbo", OperationCategory.TREATMENT],
    ["Fungicida", OperationCategory.TREATMENT],
    ["Insetticida", OperationCategory.TREATMENT],
    ["Concimazione", OperationCategory.TREATMENT],
    ["Fogliare", OperationCategory.TREATMENT],
    ["Trattamento altro", OperationCategory.TREATMENT],
    ["Altro", OperationCategory.OTHER]
  ] as const;

  for (const [name, category] of operationTypes) {
    await prisma.operationType.upsert({
      where: { name },
      update: {},
      create: { name, category }
    });
  }

  await prisma.productMaterial.upsert({
    where: { name: "Semente mais demo" },
    update: { active: true },
    create: {
      name: "Semente mais demo",
      category: "Semente",
      unit: "kg",
      notes: "Materiale demo per magazzino e lavorazioni."
    }
  });

  const units = [
    ["kg", "Chilogrammi"],
    ["l", "Litri"],
    ["q", "Quintali"],
    ["t", "Tonnellate"],
    ["pz", "Pezzi"]
  ] as const;

  for (const [code, label] of units) {
    await prisma.unitOfMeasure.upsert({
      where: { code },
      update: { label },
      create: { code, label }
    });
  }

  const supportMaterials = [
    ["Concime organico pellettato", "Concime", "kg"],
    ["Diserbante selettivo", "Agrofarmaco", "l"],
    ["Semente soia", "Semente", "kg"],
    ["Gasolio agricolo", "Carburante", "l"]
  ] as const;

  for (const [name, category, unit] of supportMaterials) {
    await prisma.productMaterial.upsert({
      where: { name },
      update: { category, unit, active: true },
      create: {
        name,
        category,
        unit,
        notes: "Materiale di supporto per Bolle, Lavorazioni e Magazzino."
      }
    });
  }

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

  await prisma.ddtDestination.upsert({
    where: {
      customerId_name_address: {
        customerId: "customer-demo",
        name: "Centro raccolta demo",
        address: "Destinazione demo"
      }
    },
    update: {},
    create: {
      customerId: "customer-demo",
      name: "Centro raccolta demo",
      address: "Destinazione demo"
    }
  });

  const dummyOperations = await prisma.operation.findMany({
    where: { notes: "Record demo generato dal seed." },
    select: { id: true }
  });
  const dummyOperationIds = dummyOperations.map((operation) => operation.id);

  if (dummyOperationIds.length > 0) {
    await prisma.warehouseMovement.deleteMany({
      where: { operationId: { in: dummyOperationIds } }
    });
    await prisma.calendarEvent.deleteMany({
      where: { operationId: { in: dummyOperationIds } }
    });
    await prisma.operation.deleteMany({
      where: { id: { in: dummyOperationIds } }
    });
  }
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
