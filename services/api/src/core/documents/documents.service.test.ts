import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@sylembra/shared";
import { DocumentError, parseDocumentUploadInput, uploadDocument } from "./documents.service.js";
import { LocalStorageProvider, type StorageProvider } from "./storage.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

let tempDirs: string[] = [];

afterEach(async () => {
  vi.unstubAllEnvs();
  await Promise.all(tempDirs.map((dir) => rm(dir, { force: true, recursive: true })));
  tempDirs = [];
});

function prismaMock() {
  return {
    license: {
      findFirst: vi.fn().mockResolvedValue({
        id: "lic-1",
        professionalId: "pro-1",
        professional: {
          id: "pro-1",
          organizationId: "org-1",
          responsibleRtId: null,
          unitId: "unit-1",
          sectorId: "sector-1"
        }
      })
    },
    document: {
      create: vi.fn().mockResolvedValue({
        id: "doc-1",
        professionalId: "pro-1",
        licenseId: "lic-1",
        fileKey: "org-1/pro-1/lic-1/file.pdf",
        fileName: "documento.pdf",
        mimeType: "application/pdf",
        size: 4,
        status: "UPLOADED"
      })
    },
    auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
  };
}

describe("documents service", () => {
  it("parses binary upload inputs from query and headers", () => {
    expect(
      parseDocumentUploadInput({
        query: { professionalId: " pro-1 ", licenseId: "lic-1", fileName: "arquivo.pdf" },
        headers: { "content-type": "application/pdf; charset=binary" },
        body: Buffer.from("file")
      })
    ).toEqual({
      professionalId: "pro-1",
      licenseId: "lic-1",
      fileName: "arquivo.pdf",
      mimeType: "application/pdf",
      body: Buffer.from("file")
    });
  });

  it("saves file through provider and stores only metadata in database", async () => {
    const prisma = prismaMock();
    const storage: StorageProvider = { put: vi.fn().mockResolvedValue(undefined), get: vi.fn() };

    await uploadDocument(prisma as never, storage, admin, {
      professionalId: "pro-1",
      licenseId: "lic-1",
      fileName: "../registro.pdf",
      mimeType: "application/pdf",
      body: Buffer.from("file")
    });

    expect(storage.put).toHaveBeenCalledWith(
      expect.objectContaining({
        fileKey: expect.stringContaining("org-1/pro-1/lic-1/"),
        body: Buffer.from("file"),
        mimeType: "application/pdf"
      })
    );
    expect(prisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileKey: expect.stringContaining("org-1/pro-1/lic-1/"),
          fileName: "registro.pdf",
          mimeType: "application/pdf",
          size: 4,
          status: "UPLOADED",
          uploadedByUserId: "admin-1"
        })
      })
    );
  });

  it("rejects unsupported mime types before storage write", async () => {
    const prisma = prismaMock();
    const storage: StorageProvider = { put: vi.fn(), get: vi.fn() };

    await expect(
      uploadDocument(prisma as never, storage, admin, {
        professionalId: "pro-1",
        licenseId: "lic-1",
        fileName: "script.js",
        mimeType: "application/javascript",
        body: Buffer.from("alert(1)")
      })
    ).rejects.toEqual(new DocumentError("UNSUPPORTED_TYPE"));
    expect(storage.put).not.toHaveBeenCalled();
  });

  it("rejects files above configured size before storage write", async () => {
    vi.stubEnv("DOCUMENT_MAX_BYTES", "3");
    const prisma = prismaMock();
    const storage: StorageProvider = { put: vi.fn(), get: vi.fn() };

    await expect(
      uploadDocument(prisma as never, storage, admin, {
        professionalId: "pro-1",
        licenseId: "lic-1",
        fileName: "arquivo.pdf",
        mimeType: "application/pdf",
        body: Buffer.from("file")
      })
    ).rejects.toEqual(new DocumentError("FILE_TOO_LARGE"));
    expect(storage.put).not.toHaveBeenCalled();
  });

  it("reads back files from local private storage", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "sylembra-storage-"));
    tempDirs.push(root);
    const storage = new LocalStorageProvider(root);

    await storage.put({ fileKey: "org/pro/lic/file.pdf", body: Buffer.from("file"), mimeType: "application/pdf" });
    await expect(storage.get("org/pro/lic/file.pdf")).resolves.toEqual({
      fileKey: "org/pro/lic/file.pdf",
      body: Buffer.from("file"),
      mimeType: "application/octet-stream"
    });
    await expect(storage.get("../outside.pdf")).rejects.toThrow("INVALID_FILE_KEY");
  });
});
