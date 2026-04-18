import { ModulePage } from "@/components/app/module-page";
import { modulePages } from "@/lib/demo-data";

export default function ProductSheetsPage() {
  return <ModulePage {...modulePages["schede-prodotti"]} />;
}
