import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import {
  archiveOperationalAttachment,
  getOperationalAttachmentFile,
  OperationalAttachmentError,
  parseOperationalAttachmentUploadInput,
  uploadOperationalAttachment
} from "./operational-attachments.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const seller: CurrentUser = { ...admin, id: "seller-1", role: "VENDEDOR" };
const pngBody = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);

describe("operational attachments service", () => {
  it("parses upload input with controlled surfaces", () => {
    expect(
      parseOperationalAttachmentUploadInput({
        query: { surface: " Script-Library ", entityId: " script-1 " },
        headers: { "content-type": "image/png; charset=binary", "x-file-name": "clip.png" },
        body: pngBody
      })
    ).toEqual({
      surface: "script-library",
      entityId: "script-1",
      fileName: "clip.png",
      mimeType: "image/png",
      body: pngBody
    });

    expect(
      parseOperationalAttachmentUploadInput({
        query: { surface: "billing" },
        headers: { "content-type": "image/png" },
        body: pngBody
      }).surface
    ).toBeUndefined();
  });

  it("uploads image attachments into private organization storage", async () => {
    const prisma = {
      operationalAttachment: {
        create: vi.fn().mockResolvedValue({
          id: "att-1",
          organizationId: "org-1",
          surface: "script-library",
          entityId: "script-1",
          fileKey: "org-1/operational-attachments/script-library/file.png",
          fileName: "clip.png",
          mimeType: "image/png",
          size: pngBody.length
        })
      },
      auditLog: { create: vi.fn() }
    };
    const storage = { put: vi.fn(), get: vi.fn(), objectUrl: vi.fn() };

    const attachment = await uploadOperationalAttachment(prisma as never, storage as never, seller, {
      surface: "script-library",
      entityId: "script-1",
      fileName: "clip.png",
      mimeType: "image/png",
      body: pngBody
    });

    expect(attachment.markdownUrl).toBe("/v1/attachments/operational/att-1/file");
    expect(storage.put).toHaveBeenCalledWith(expect.objectContaining({ fileKey: expect.stringContaining("org-1/operational-attachments/script-library/") }));
    expect(prisma.operationalAttachment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ organizationId: "org-1", uploadedById: "seller-1", surface: "script-library", entityId: "script-1" })
      })
    );
  });

  it("downloads only attachments from the actor organization", async () => {
    const prisma = {
      operationalAttachment: {
        findFirst: vi.fn().mockResolvedValue({
          id: "att-1",
          organizationId: "org-1",
          fileKey: "org-1/operational-attachments/faq/file.png",
          fileName: "clip.png",
          mimeType: "image/png",
          size: pngBody.length
        })
      }
    };
    const storage = { put: vi.fn(), get: vi.fn().mockResolvedValue({ body: pngBody, mimeType: "image/png" }), objectUrl: vi.fn() };

    const file = await getOperationalAttachmentFile(prisma as never, storage as never, seller, "att-1");

    expect(prisma.operationalAttachment.findFirst).toHaveBeenCalledWith({
      where: { id: "att-1", organizationId: "org-1", archivedAt: null }
    });
    expect(file.body).toBe(pngBody);
  });

  it("archives operational attachments auditably without deleting the stored file", async () => {
    const prisma = {
      operationalAttachment: {
        findFirst: vi.fn().mockResolvedValue({
          id: "att-1",
          organizationId: "org-1",
          surface: "faq",
          entityId: "thread-1",
          fileName: "clip.png"
        }),
        update: vi.fn().mockResolvedValue({ id: "att-1", archivedAt: new Date("2026-06-19T12:00:00.000Z") })
      },
      auditLog: { create: vi.fn() }
    };

    await archiveOperationalAttachment(prisma as never, admin, "att-1");

    expect(prisma.operationalAttachment.update).toHaveBeenCalledWith({
      where: { id: "att-1" },
      data: expect.objectContaining({ archivedById: "admin-1", archivedAt: expect.any(Date) })
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ action: "operational_attachment.archive", entityType: "OperationalAttachment", entityId: "att-1" })
      })
    );
  });

  it("rejects non-admin archive attempts", async () => {
    await expect(archiveOperationalAttachment({} as never, seller, "att-1")).rejects.toEqual(new OperationalAttachmentError("FORBIDDEN"));
  });
});
