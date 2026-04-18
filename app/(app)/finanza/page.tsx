import { ModulePage } from "@/components/app/module-page";
import { modulePages } from "@/lib/demo-data";

export default function FinancePage() {
  return <ModulePage {...modulePages.finanza} />;
}
