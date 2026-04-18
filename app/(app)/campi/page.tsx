import { ModulePage } from "@/components/app/module-page";
import { modulePages } from "@/lib/demo-data";

export default function FieldsPage() {
  return <ModulePage {...modulePages.campi} />;
}
