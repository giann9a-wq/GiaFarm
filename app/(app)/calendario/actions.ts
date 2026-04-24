"use server";

import { CalendarEventSource } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/permissions";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { manualCalendarEventSchema } from "@/lib/validation/calendar";

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function combineDateAndTime(
  dateKey: string,
  timeKey: string,
  formData: FormData,
) {
  const date = stringValue(formData, dateKey);
  const time = stringValue(formData, timeKey);
  if (!date) return undefined;
  if (!time) return new Date(`${date}T00:00:00.000Z`);
  return new Date(`${date}T${time}:00`);
}

export async function createManualCalendarEventAction(formData: FormData) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const allDay = formData.get("allDay") === "on";
  const startsAt = combineDateAndTime("startsOn", "startsTime", formData);
  const endsAt = combineDateAndTime("endsOn", "endsTime", formData);

  const parsed = manualCalendarEventSchema.parse({
    title: stringValue(formData, "title"),
    startsAt,
    endsAt,
    allDay,
    eventType: stringValue(formData, "eventType") || undefined,
    campaignId: stringValue(formData, "campaignId") || undefined,
    fieldGroupId: stringValue(formData, "fieldGroupId") || undefined,
    notes: stringValue(formData, "notes") || undefined,
  });

  const event = await prisma.calendarEvent.create({
    data: {
      title: parsed.title,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt ?? null,
      allDay: parsed.allDay,
      source: CalendarEventSource.MANUAL,
      eventType: parsed.eventType || null,
      campaignId: parsed.campaignId || null,
      fieldGroupId: parsed.fieldGroupId || null,
      notes: parsed.notes || null,
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "CALENDAR_EVENT_CREATED",
    entityType: "CalendarEvent",
    entityId: event.id,
    after: event,
  });

  revalidatePath("/calendario");
  redirect("/calendario");
}

export async function updateManualCalendarEventAction(
  eventId: string,
  formData: FormData,
) {
  const session = await requireUser();
  const actorUserId = session.user!.id;
  const before = await prisma.calendarEvent.findUnique({
    where: { id: eventId },
  });
  if (!before || before.source !== CalendarEventSource.MANUAL) {
    throw new Error("Evento manuale non trovato.");
  }

  const allDay = formData.get("allDay") === "on";
  const startsAt = combineDateAndTime("startsOn", "startsTime", formData);
  const endsAt = combineDateAndTime("endsOn", "endsTime", formData);

  const parsed = manualCalendarEventSchema.parse({
    title: stringValue(formData, "title"),
    startsAt,
    endsAt,
    allDay,
    eventType: stringValue(formData, "eventType") || undefined,
    campaignId: stringValue(formData, "campaignId") || undefined,
    fieldGroupId: stringValue(formData, "fieldGroupId") || undefined,
    notes: stringValue(formData, "notes") || undefined,
  });

  const event = await prisma.calendarEvent.update({
    where: { id: eventId },
    data: {
      title: parsed.title,
      startsAt: parsed.startsAt,
      endsAt: parsed.endsAt ?? null,
      allDay: parsed.allDay,
      eventType: parsed.eventType || null,
      campaignId: parsed.campaignId || null,
      fieldGroupId: parsed.fieldGroupId || null,
      notes: parsed.notes || null,
    },
  });

  await writeAuditLog({
    actorUserId,
    action: "CALENDAR_EVENT_UPDATED",
    entityType: "CalendarEvent",
    entityId: event.id,
    before,
    after: event,
  });

  revalidatePath("/calendario");
  redirect("/calendario");
}
