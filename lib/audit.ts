import { prisma } from "@/lib/prisma";

type AuditInput = {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
  ipAddress?: string;
};

export async function writeAuditLog(input: AuditInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      before: input.before === undefined ? undefined : JSON.parse(JSON.stringify(input.before)),
      after: input.after === undefined ? undefined : JSON.parse(JSON.stringify(input.after)),
      metadata:
        input.metadata === undefined ? undefined : JSON.parse(JSON.stringify(input.metadata)),
      ipAddress: input.ipAddress
    }
  });
}
