import { RoleCode } from "@prisma/client";
import { ModulePage } from "@/components/app/module-page";
import { requireRole } from "@/lib/auth/permissions";
import { modulePages } from "@/lib/demo-data";

export default async function SettingsPage() {
  await requireRole(RoleCode.ADMIN);
  return <ModulePage {...modulePages.impostazioni} />;
}
