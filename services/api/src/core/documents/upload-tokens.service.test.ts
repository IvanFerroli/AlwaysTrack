import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import type { StorageProvider } from "./storage.js";
import {
  createUploadToken,
  getPublicUploadToken,
  hashUploadToken,
  parseCreateUploadTokenInput,
  parsePublicUploadInput,
  uploadDocumentWithToken,
  UploadTokenError
} from "./upload-tokens.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

const supervisor: CurrentUser = {
  id: "sup-1",
  name: "Supervisor",
  email: "sup@example.com",
  role: "SUPERVISOR",
  organizationId: "org-1",
  unitScopeIds: ["unit-1"],
  sectorScopeIds: []
};

const pdfBody = Buffer.from("%PDF-1.7\n%%EOF\n");

function license() {
  return {
    id: "lic-1",
    professionalId: "pro-1",
    status: "PENDING_DOCUMENT",
    number: "REG-1",
    expiresAt: new Date("2027-01-01T00:00:00.000Z"),
    licenseType: { name: "Registro" },
    professional: {
      id: "pro-1",
      name: "Ana",
      organizationId: "org-1",
      responsibleRtId: null,
      unitId: "unit-1",
      sectorId: "sector-1"
    }
  };
}

function uploadToken(overrides: Record<string, unknown> = {}) {
  return {
    id: "tok-1",
    professionalId: "pro-1",
    licenseId: "lic-1",
    active: true,
    usedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    professional: license().professional,
    license: license(),
    ...overrides
  };
}

describe("upload tokens service", () => {
  it("parses token creation input with default expiration", () => {
    const parsed = parseCreateUploadTokenInput({ professionalId: " pro-1 ", licenseId: "lic-1" });
    expect(parsed.professionalId).toBe("pro-1");
    expect(parsed.licenseId).toBe("lic-1");
    expect(parsed.expiresAt).toBeInstanceOf(Date);
  });

  it("hashes raw token deterministically without returning raw value", () => {
    expect(hashUploadToken("secret-token")).toBe(hashUploadToken("secret-token"));
    expect(hashUploadToken("secret-token")).not.toBe("secret-token");
  });

  it("creates hashed tokens and audits generation", async () => {
    const prisma = {
      license: { findFirst: vi.fn().mockResolvedValue(license()) },
      uploadToken: {
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "tok-1", ...data }))
      },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };

    const result = await createUploadToken(prisma as never, admin, {
      professionalId: "pro-1",
      licenseId: "lic-1",
      expiresAt: new Date("2027-01-01T00:00:00.000Z")
    });

    expect(result.token).toBeTruthy();
    expect(prisma.uploadToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tokenHash: expect.not.stringMatching(result.token),
          professionalId: "pro-1",
          licenseId: "lic-1"
        })
      })
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "upload_token.create" }) })
    );
  });

  it("blocks non-admin token generation", async () => {
    const prisma = {
      license: { findFirst: vi.fn().mockResolvedValue(license()) },
      uploadToken: { create: vi.fn() }
    };

    await expect(
      createUploadToken(prisma as never, supervisor, {
        professionalId: "pro-1",
        licenseId: "lic-1",
        expiresAt: new Date("2027-01-01T00:00:00.000Z")
      })
    ).rejects.toEqual(new UploadTokenError("FORBIDDEN"));
  });

  it("returns minimal public upload data for valid tokens", async () => {
    const prisma = {
      uploadToken: { findUnique: vi.fn().mockResolvedValue(uploadToken()) }
    };

    await expect(getPublicUploadToken(prisma as never, "raw")).resolves.toEqual({
      id: "tok-1",
      expiresAt: expect.any(Date),
      professional: { name: "Ana" },
      license: {
        number: "REG-1",
        expiresAt: expect.any(Date),
        licenseType: { name: "Registro" }
      }
    });
  });

  it("rejects expired, used and missing tokens", async () => {
    await expect(
      getPublicUploadToken({ uploadToken: { findUnique: vi.fn().mockResolvedValue(null) } } as never, "missing")
    ).rejects.toEqual(new UploadTokenError("NOT_FOUND"));
    await expect(
      getPublicUploadToken(
        { uploadToken: { findUnique: vi.fn().mockResolvedValue(uploadToken({ expiresAt: new Date(Date.now() - 1) })) } } as never,
        "expired"
      )
    ).rejects.toEqual(new UploadTokenError("EXPIRED"));
    await expect(
      getPublicUploadToken(
        { uploadToken: { findUnique: vi.fn().mockResolvedValue(uploadToken({ usedAt: new Date() })) } } as never,
        "used"
      )
    ).rejects.toEqual(new UploadTokenError("USED"));
  });

  it("uploads with token, marks token used, moves license to pending validation and audits", async () => {
    const prisma = {
      uploadToken: {
        findUnique: vi.fn().mockResolvedValue(uploadToken()),
        update: vi.fn().mockResolvedValue({ id: "tok-1", active: false })
      },
      document: {
        create: vi.fn().mockResolvedValue({ id: "doc-1", size: pdfBody.length })
      },
      license: { update: vi.fn().mockResolvedValue({ id: "lic-1", status: "PENDING_VALIDATION" }) },
      auditLog: { create: vi.fn().mockResolvedValue({ id: "audit-1" }) }
    };
    const storage: StorageProvider = { put: vi.fn().mockResolvedValue(undefined), get: vi.fn() };

    const document = await uploadDocumentWithToken(prisma as never, storage, {
      token: "raw",
      fileName: "registro.pdf",
      mimeType: "application/pdf",
      body: pdfBody
    });

    expect(document.id).toBe("doc-1");
    expect(storage.put).toHaveBeenCalled();
    expect(prisma.uploadToken.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "tok-1" }, data: expect.objectContaining({ active: false }) })
    );
    expect(prisma.license.update).toHaveBeenCalledWith({
      where: { id: "lic-1" },
      data: { status: "PENDING_VALIDATION" }
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ action: "upload_token.use", actorId: null }) })
    );
  });

  it("parses public binary upload input", () => {
    expect(
      parsePublicUploadInput({
        token: "raw",
        query: { fileName: "registro.pdf" },
        headers: { "content-type": "application/pdf" },
        body: pdfBody
      })
    ).toEqual({
      token: "raw",
      fileName: "registro.pdf",
      mimeType: "application/pdf",
      body: pdfBody
    });
  });
});
