import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@sylembra/shared";
import { createProfessionalsLicensesGoogleSheetTemplate } from "./google-sheets-template.service.js";

const admin: CurrentUser = {
  id: "admin-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  organizationId: "org-1",
  unitScopeIds: [],
  sectorScopeIds: []
};

function basePrisma() {
  return {
    unit: {
      findMany: vi.fn().mockResolvedValue([{ id: "unit-1", name: "RH-GERAL", organizationId: "org-1", active: true }])
    },
    sector: {
      findMany: vi.fn().mockResolvedValue([
        { id: "sector-1", unitId: "unit-1", name: "GOVERNANCA", active: true, unit: { name: "RH-GERAL" } }
      ])
    },
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: "rt-1", name: "RT Demo", email: "rt@example.com", role: "RT", active: true }])
    },
    licenseType: {
      findMany: vi.fn().mockResolvedValue([{ id: "type-1", name: "Registro profissional demo", active: true }])
    }
  };
}

describe("google sheets template import helper", () => {
  it("creates a Google Sheet with native dropdowns from database lists", async () => {
    const { privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
      privateKeyEncoding: { format: "pem", type: "pkcs8" },
      publicKeyEncoding: { format: "pem", type: "spki" }
    });
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ access_token: "token-123" }), { status: 200, headers: { "content-type": "application/json" } })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            spreadsheetId: "sheet-123",
            spreadsheetUrl: "https://docs.google.com/spreadsheets/d/sheet-123/edit",
            sheets: [
              { properties: { sheetId: 11, title: "Modelo" } },
              { properties: { sheetId: 22, title: "Listas" } }
            ]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        )
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({ totalUpdatedRows: 2 }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ replies: [] }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "perm-1" }), { status: 200, headers: { "content-type": "application/json" } }));

    const result = await createProfessionalsLicensesGoogleSheetTemplate(basePrisma() as never, admin, {
      fetcher: fetcher as never,
      env: {
        databaseUrl: "file:./dev.db",
        sessionSecret: "secret",
        port: 3333,
        storageProvider: "local",
        storageLocalDir: ".storage/private",
        documentMaxBytes: 1024,
        notificationProvider: "fake",
        notificationJobLimit: 25,
        documentAiProvider: "fake",
        documentAiModel: "fake",
        googleServiceAccountEmail: "service@example.com",
        googlePrivateKey: privateKey,
        googleSheetsTemplateShareEmail: "ops@example.com",
        googleSheetsTemplateShareRole: "writer"
      }
    });

    expect(result).toMatchObject({
      spreadsheetId: "sheet-123",
      spreadsheetUrl: "https://docs.google.com/spreadsheets/d/sheet-123/edit",
      sharedWith: "ops@example.com"
    });
    expect(fetcher).toHaveBeenCalledTimes(5);
    expect(String(fetcher.mock.calls[1]?.[0])).toContain("/spreadsheets");
    expect(String(fetcher.mock.calls[2]?.[0])).toContain("/values:batchUpdate");
    expect(String(fetcher.mock.calls[3]?.[0])).toContain(":batchUpdate");
    expect(String(fetcher.mock.calls[4]?.[0])).toContain("/permissions");
  });
});
