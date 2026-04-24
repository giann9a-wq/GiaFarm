import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarEventForm } from "@/app/(app)/calendario/event-form";
import { PageHeader } from "@/components/app/page-header";
import { Button } from "@/components/ui/button";
import { getManualCalendarEvent } from "@/lib/calendar/queries";

export default async function EditCalendarEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getManualCalendarEvent(id);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Modifica evento"
        subtitle="Aggiorna un evento manuale del calendario operativo."
      />
      <Button asChild variant="secondary">
        <Link href="/calendario">Torna al calendario</Link>
      </Button>
      <CalendarEventForm eventId={id} />
    </div>
  );
}
