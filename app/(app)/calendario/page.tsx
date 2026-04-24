import Link from "next/link";
import { CalendarEventForm } from "@/app/(app)/calendario/event-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { getCalendarBaseData, getCalendarEvents } from "@/lib/calendar/queries";
import { formatFinanceDate } from "@/lib/finance/format";

type CalendarPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDateTime(value: Date, allDay: boolean) {
  if (allDay) return formatFinanceDate(value);
  return new Intl.DateTimeFormat("it-IT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = await searchParams;
  const filters = {
    campaignId: single(params.campaignId),
    fieldGroupId: single(params.fieldGroupId),
    from: single(params.from),
    to: single(params.to),
  };
  const [{ campaigns, fieldGroups }, events] = await Promise.all([
    getCalendarBaseData(),
    getCalendarEvents(filters),
  ]);

  const groupsByDay = events.reduce<
    Array<{ label: string; items: typeof events }>
  >((days, event) => {
    const label = new Intl.DateTimeFormat("it-IT", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(event.startsAt);
    const existing = days.find((day) => day.label === label);
    if (existing) {
      existing.items.push(event);
    } else {
      days.push({ label, items: [event] });
    }
    return days;
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Calendario"
        subtitle="Eventi automatici dalle lavorazioni e promemoria manuali nello stesso calendario operativo."
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Eventi per data</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="grid gap-4 rounded-[8px] border border-border bg-muted/30 p-4 lg:grid-cols-4">
              <label className="text-sm font-medium">
                Campagna
                <select
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  defaultValue={filters.campaignId ?? ""}
                  name="campaignId"
                >
                  <option value="">Tutte</option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Gruppo
                <select
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  defaultValue={filters.fieldGroupId ?? ""}
                  name="fieldGroupId"
                >
                  <option value="">Tutti</option>
                  {fieldGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.campaign.name} - {group.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium">
                Dal
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  defaultValue={filters.from ?? ""}
                  name="from"
                  type="date"
                />
              </label>
              <label className="text-sm font-medium">
                Al
                <input
                  className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
                  defaultValue={filters.to ?? ""}
                  name="to"
                  type="date"
                />
              </label>
            </form>

            <div className="space-y-4">
              {groupsByDay.map((day) => (
                <div key={day.label}>
                  <h3 className="mb-3 text-sm font-semibold uppercase text-muted-foreground">
                    {day.label}
                  </h3>
                  <div className="space-y-3">
                    {day.items.map((event) => (
                      <div
                        className="rounded-[8px] border border-border p-4"
                        key={event.id}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{event.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatDateTime(event.startsAt, event.allDay)}
                              {event.fieldGroup
                                ? ` · ${event.fieldGroup.name}`
                                : ""}
                              {event.campaign
                                ? ` · ${event.campaign.name}`
                                : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-[8px] px-2 py-1 text-xs font-semibold ${
                                event.source === "SYSTEM"
                                  ? "bg-muted text-foreground"
                                  : "bg-primary/10 text-primary"
                              }`}
                            >
                              {event.source === "SYSTEM"
                                ? "Automatico"
                                : "Manuale"}
                            </span>
                            {event.source === "MANUAL" ? (
                              <Button asChild variant="secondary">
                                <Link href={`/calendario/${event.id}/modifica`}>
                                  Modifica
                                </Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {event.eventType ?? "Evento"}
                          {event.notes ? ` · ${event.notes}` : ""}
                        </p>
                        {event.source === "SYSTEM" && event.operation ? (
                          <div className="mt-3">
                            <Button asChild variant="secondary">
                              <Link href={`/lavorazioni/${event.operation.id}`}>
                                Apri lavorazione
                              </Link>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {groupsByDay.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nessun evento nel periodo selezionato.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h2 className="font-semibold">Nuovo evento manuale</h2>
              <p className="text-sm text-muted-foreground">
                Appuntamenti, consegne, scadenze e promemoria operativi.
              </p>
            </CardHeader>
            <CardContent>
              <CalendarEventForm />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
