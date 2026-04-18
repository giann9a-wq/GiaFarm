import { redirect } from "next/navigation";
import { RoleCode } from "@prisma/client";
import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id || !session.user.isActive) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: RoleCode) {
  const session = await requireUser();
  if (!session.user?.roles.includes(role)) {
    redirect("/");
  }
  return session;
}

export function canManageCriticalData(roles: RoleCode[] = []) {
  return roles.includes(RoleCode.ADMIN);
}
