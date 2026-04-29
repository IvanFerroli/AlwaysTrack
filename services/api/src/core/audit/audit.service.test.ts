import { describe, expect, it, vi } from "vitest";
import { listAuditLogs, recordAuditLog } from "./audit.service.js";

describe("audit service", () => {
  it("records audit logs with nullable actor context", async () => {
    const create = vi.fn().mockResolvedValue({ id: "audit-1" });
    const prisma = {
      auditLog: { create }
    };

    await recordAuditLog(prisma as never, {
      organizationId: "org-1",
      actorId: null,
      action: "upload-token.used",
      entityType: "UploadToken",
      entityId: "token-1",
      metadata: { source: "magic-link" }
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        organizationId: "org-1",
        actorId: null,
        action: "upload-token.used",
        entityType: "UploadToken",
        entityId: "token-1",
        metadataJson: JSON.stringify({ source: "magic-link" })
      }
    });
  });

  it("filters by organization and paginates audit queries", async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const count = vi.fn().mockResolvedValue(0);
    const transaction = vi.fn().mockResolvedValue([[], 0]);
    const prisma = {
      auditLog: { findMany, count },
      $transaction: transaction
    };

    await listAuditLogs(prisma as never, {
      organizationId: "org-1",
      action: "auth.login",
      page: 2,
      pageSize: 10
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          action: "auth.login"
        }),
        skip: 10,
        take: 10
      })
    );
    expect(count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        organizationId: "org-1",
        action: "auth.login"
      })
    });
  });
});
