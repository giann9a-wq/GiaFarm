"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import {
  decimalInputToString,
  fieldFormSchema,
  fieldPacHistorySchema,
  fieldUsageHistorySchema
} from "@/lib/validation/fields";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

export async function createFieldAction(formData: FormData) {
  const session = await requireUser();
  const parsed = fieldFormSchema.parse({
    municipality: formValue(formData, "municipality"),
    cadastralSheet: formValue(formData, "cadastralSheet"),
    cadastralParcel: formValue(formData, "cadastralParcel"),
    commonName: formValue(formData, "commonName"),
    cadastralAreaSqm: formValue(formData, "cadastralAreaSqm"),
    notes: formValue(formData, "notes")
  });

  const field = await prisma.field.create({
    data: {
      municipality: parsed.municipality.toUpperCase(),
      cadastralSheet: parsed.cadastralSheet,
      cadastralParcel: parsed.cadastralParcel,
      commonName: parsed.commonName || null,
      cadastralAreaSqm: decimalInputToString(parsed.cadastralAreaSqm),
      notes: parsed.notes || null
    }
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "FIELD_CREATED",
    entityType: "Field",
    entityId: field.id,
    after: field
  });

  revalidatePath("/campi");
  redirect(`/campi/${field.id}`);
}

export async function updateFieldAction(fieldId: string, formData: FormData) {
  const session = await requireUser();
  const parsed = fieldFormSchema.parse({
    municipality: formValue(formData, "municipality"),
    cadastralSheet: formValue(formData, "cadastralSheet"),
    cadastralParcel: formValue(formData, "cadastralParcel"),
    commonName: formValue(formData, "commonName"),
    cadastralAreaSqm: formValue(formData, "cadastralAreaSqm"),
    notes: formValue(formData, "notes")
  });

  const before = await prisma.field.findUniqueOrThrow({ where: { id: fieldId } });
  const after = await prisma.field.update({
    where: { id: fieldId },
    data: {
      municipality: parsed.municipality.toUpperCase(),
      cadastralSheet: parsed.cadastralSheet,
      cadastralParcel: parsed.cadastralParcel,
      commonName: parsed.commonName || null,
      cadastralAreaSqm: decimalInputToString(parsed.cadastralAreaSqm),
      notes: parsed.notes || null
    }
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: "FIELD_UPDATED",
    entityType: "Field",
    entityId: fieldId,
    before,
    after
  });

  revalidatePath("/campi");
  revalidatePath(`/campi/${fieldId}`);
  redirect(`/campi/${fieldId}`);
}

export async function upsertFieldUsageHistoryAction(fieldId: string, formData: FormData) {
  const session = await requireUser();
  const parsed = fieldUsageHistorySchema.parse({
    year: formValue(formData, "year"),
    usedAreaSqm: formValue(formData, "usedAreaSqm"),
    note: formValue(formData, "note")
  });

  const before = await prisma.fieldUsageHistory.findUnique({
    where: { fieldId_year: { fieldId, year: parsed.year } }
  });
  const after = await prisma.fieldUsageHistory.upsert({
    where: { fieldId_year: { fieldId, year: parsed.year } },
    update: {
      usedAreaSqm: decimalInputToString(parsed.usedAreaSqm),
      note: parsed.note || null,
      changedByUserId: session.user?.id
    },
    create: {
      fieldId,
      year: parsed.year,
      usedAreaSqm: decimalInputToString(parsed.usedAreaSqm),
      note: parsed.note || null,
      changedByUserId: session.user?.id
    }
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: before ? "FIELD_USAGE_HISTORY_UPDATED" : "FIELD_USAGE_HISTORY_CREATED",
    entityType: "FieldUsageHistory",
    entityId: after.id,
    before,
    after,
    metadata: { fieldId, year: parsed.year }
  });

  revalidatePath("/campi");
  revalidatePath(`/campi/${fieldId}`);
  redirect(`/campi/${fieldId}`);
}

export async function upsertFieldPacHistoryAction(fieldId: string, formData: FormData) {
  const session = await requireUser();
  const parsed = fieldPacHistorySchema.parse({
    year: formValue(formData, "year"),
    included: formValue(formData, "included"),
    note: formValue(formData, "note")
  });
  const included =
    parsed.included === "unknown" ? null : parsed.included === "true";

  const before = await prisma.fieldPacHistory.findUnique({
    where: { fieldId_year: { fieldId, year: parsed.year } }
  });
  const after = await prisma.fieldPacHistory.upsert({
    where: { fieldId_year: { fieldId, year: parsed.year } },
    update: {
      included,
      note: parsed.note || null,
      changedByUserId: session.user?.id
    },
    create: {
      fieldId,
      year: parsed.year,
      included,
      note: parsed.note || null,
      changedByUserId: session.user?.id
    }
  });

  await writeAuditLog({
    actorUserId: session.user?.id,
    action: before ? "FIELD_PAC_HISTORY_UPDATED" : "FIELD_PAC_HISTORY_CREATED",
    entityType: "FieldPacHistory",
    entityId: after.id,
    before,
    after,
    metadata: { fieldId, year: parsed.year }
  });

  revalidatePath("/campi");
  revalidatePath(`/campi/${fieldId}`);
  redirect(`/campi/${fieldId}`);
}
