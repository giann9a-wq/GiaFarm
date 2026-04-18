import { ModulePage } from "@/components/app/module-page";
import { modulePages } from "@/lib/demo-data";

export default function DeliveryNotesPage() {
  return <ModulePage {...modulePages["bolle-ddt"]} />;
}
