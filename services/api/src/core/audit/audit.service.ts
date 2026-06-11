import type { Prisma, PrismaClient } from "@prisma/client";

export interface RecordAuditLogInput {
  organizationId: string;
  actorId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: unknown;
}

export async function recordAuditLog(prisma: PrismaClient, input: RecordAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadataJson: input.metadata === undefined ? null : JSON.stringify(input.metadata)
    }
  });
}

export interface ListAuditLogsInput {
  organizationId: string;
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export async function listAuditLogs(prisma: PrismaClient, input: ListAuditLogsInput) {
  const page = Math.max(input.page ?? 1, 1);
  const pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100);
  const where: Prisma.AuditLogWhereInput = {
    organizationId: input.organizationId,
    actorId: input.actorId,
    action: input.action ? { contains: input.action } : undefined,
    entityType: input.entityType,
    entityId: input.entityId,
    createdAt:
      input.from || input.to
        ? {
            gte: input.from,
            lte: input.to
          }
        : undefined
  };

  const [items, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    items,
    page,
    pageSize,
    total
  };
}
