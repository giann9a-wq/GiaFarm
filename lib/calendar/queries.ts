import { prisma } from "@/lib/prisma";

type CalendarFilters = {
  campaignId?: string;
  fieldGroupId?: string;
  from?: string;
  to?: string;
};

function buildDateRange(filters: CalendarFilters) {
  if (!filters.from && !filters.to) return undefined;
  return {
    ...(filters.from ? { gte: new Date(`${filters.from}T00:00:00.000Z`) } : {}),
    ...(filters.to ? { lte: new Date(`${filters.to}T23:59:59.999Z`) } : {}),
  };
}

export async function getCalendarBaseData() {
  const [campaigns, fieldGroups] = await Promise.all([
    prisma.campaign.findMany({ orderBy: [{ startYear: "desc" }] }),
    prisma.fieldGroup.findMany({
      include: { campaign: true, crop: true },
      orderBy: [{ campaign: { startYear: "desc" } }, { name: "asc" }],
    }),
  ]);

  return { campaigns, fieldGroups };
}

export async function getCalendarEvents(filters: CalendarFilters = {}) {
  const dateRange = buildDateRange(filters);

  const [manualEvents, operations] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        source: "MANUAL",
        ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(filters.fieldGroupId ? { fieldGroupId: filters.fieldGroupId } : {}),
        ...(dateRange ? { startsAt: dateRange } : {}),
      },
      include: {
        campaign: true,
        fieldGroup: { include: { crop: true } },
      },
      orderBy: [{ startsAt: "asc" }, { createdAt: "asc" }],
    }),
    prisma.operation.findMany({
      where: {
        ...(filters.campaignId ? { campaignId: filters.campaignId } : {}),
        ...(dateRange ? { performedOn: dateRange } : {}),
      },
      include: {
        campaign: true,
        operationType: true,
        fields: { include: { field: true } },
        fieldGroups: {
          include: { fieldGroup: { include: { crop: true } } },
        },
      },
      orderBy: [{ performedOn: "asc" }, { createdAt: "asc" }],
    }),
  ]);

  const systemEvents = operations
    .filter((operation) => {
      if (!filters.fieldGroupId) return true;
      return operation.fieldGroups.some(
        ({ fieldGroup }) => fieldGroup.id === filters.fieldGroupId,
      );
    })
    .map((operation) => ({
      id: `operation-${operation.id}`,
      title: operation.operationType.name,
      startsAt: operation.performedOn,
      endsAt: null,
      allDay: true,
      source: "SYSTEM" as const,
      eventType: operation.operationType.category,
      notes: operation.notes ?? operation.treatmentReason ?? null,
      campaign: operation.campaign,
      fieldGroup: operation.fieldGroups[0]?.fieldGroup ?? null,
      fields: operation.fields.map(({ field }) => field),
      operation,
    }));

  const manual = manualEvents.map((event) => ({
    id: event.id,
    title: event.title,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    allDay: event.allDay,
    source: "MANUAL" as const,
    eventType: event.eventType,
    notes: event.notes,
    campaign: event.campaign,
    fieldGroup: event.fieldGroup,
    fields: [],
    operation: null,
  }));

  const merged = [...systemEvents, ...manual].sort(
    (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
  );

  return merged;
}

export async function getManualCalendarEvent(id: string) {
  return prisma.calendarEvent.findFirst({
    where: { id, source: "MANUAL" },
    include: {
      campaign: true,
      fieldGroup: true,
    },
  });
}
