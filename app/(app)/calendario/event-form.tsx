import {
  createManualCalendarEventAction,
  updateManualCalendarEventAction,
} from "@/app/(app)/calendario/actions";
import { Button } from "@/components/ui/button";
import {
  getCalendarBaseData,
  getManualCalendarEvent,
} from "@/lib/calendar/queries";

export async function CalendarEventForm({ eventId }: { eventId?: string }) {
  const [{ campaigns, fieldGroups }, event] = await Promise.all([
    getCalendarBaseData(),
    eventId ? getManualCalendarEvent(eventId) : Promise.resolve(null),
  ]);
  const action = event
    ? updateManualCalendarEventAction.bind(null, event.id)
    : createManualCalendarEventAction;

  return (
    <form
      action={action}
      className="space-y-4 rounded-[8px] border border-border bg-card p-5"
    >
      <label className="block text-sm font-medium">
        Titolo
        <input
          className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
          defaultValue={event?.title ?? ""}
          name="title"
          required
        />
      </label>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Data inizio
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={event?.startsAt.toISOString().slice(0, 10)}
            name="startsOn"
            required
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Ora inizio
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={
              event?.allDay ? "" : event?.startsAt.toISOString().slice(11, 16)
            }
            name="startsTime"
            type="time"
          />
        </label>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="text-sm font-medium">
          Data fine
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={event?.endsAt?.toISOString().slice(0, 10) ?? ""}
            name="endsOn"
            type="date"
          />
        </label>
        <label className="text-sm font-medium">
          Ora fine
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={
              event?.allDay
                ? ""
                : (event?.endsAt?.toISOString().slice(11, 16) ?? "")
            }
            name="endsTime"
            type="time"
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          defaultChecked={event?.allDay ?? true}
          name="allDay"
          type="checkbox"
        />
        Evento giornata intera
      </label>
      <div className="grid gap-4 lg:grid-cols-3">
        <label className="text-sm font-medium">
          Tipologia
          <input
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={event?.eventType ?? ""}
            name="eventType"
            placeholder="Promemoria, appuntamento, consegna..."
          />
        </label>
        <label className="text-sm font-medium">
          Campagna
          <select
            className="focus-ring mt-2 h-10 w-full rounded-[8px] border border-input bg-background px-3"
            defaultValue={event?.campaignId ?? ""}
            name="campaignId"
          >
            <option value="">Nessuna campagna</option>
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
            defaultValue={event?.fieldGroupId ?? ""}
            name="fieldGroupId"
          >
            <option value="">Nessun gruppo</option>
            {fieldGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.campaign.name} - {group.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block text-sm font-medium">
        Descrizione
        <textarea
          className="focus-ring mt-2 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2"
          defaultValue={event?.notes ?? ""}
          name="notes"
        />
      </label>
      <div className="flex justify-end">
        <Button type="submit">{event ? "Salva evento" : "Crea evento"}</Button>
      </div>
    </form>
  );
}
