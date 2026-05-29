import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { createProfessionalsLicensesGoogleSheetTemplate } from "./google-sheets-template.service.js";
import { ImportError } from "./professionals-licenses-import.service.js";

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
    googleConnection: {
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn()
    },
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
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "perm-user" }), { status: 200, headers: { "content-type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "perm-1" }), { status: 200, headers: { "content-type": "application/json" } }));

    const result = await createProfessionalsLicensesGoogleSheetTemplate(basePrisma() as never, admin, {
      fetcher: fetcher as never,
      env: {
        databaseUrl: "file:./dev.db",
        sessionSecret: "secret",
        sessionCookieName: "alwaystrack_session",
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
      sharedWith: ["admin@example.com", "ops@example.com"]
    });
    expect(fetcher).toHaveBeenCalledTimes(6);
    expect(String(fetcher.mock.calls[1]?.[0])).toContain("/spreadsheets");
    expect(String(fetcher.mock.calls[2]?.[0])).toContain("/values:batchUpdate");
    expect(String(fetcher.mock.calls[3]?.[0])).toContain(":batchUpdate");
    expect(String(fetcher.mock.calls[4]?.[0])).toContain("/permissions");
    expect(String(fetcher.mock.calls[5]?.[0])).toContain("/permissions");
    expect(String(fetcher.mock.calls[4]?.[1]?.body)).toContain("admin@example.com");
    expect(String(fetcher.mock.calls[5]?.[1]?.body)).toContain("ops@example.com");
  });

  it("can create the spreadsheet inside a configured Drive folder", async () => {
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
        new Response(JSON.stringify({ id: "sheet-drive-1", webViewLink: "https://docs.google.com/spreadsheets/d/sheet-drive-1/edit" }), {
          status: 200,
          headers: { "content-type": "application/json" }
        })
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            spreadsheetId: "sheet-drive-1",
            spreadsheetUrl: "https://docs.google.com/spreadsheets/d/sheet-drive-1/edit",
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
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "perm-user" }), { status: 200, headers: { "content-type": "application/json" } }));

    const result = await createProfessionalsLicensesGoogleSheetTemplate(basePrisma() as never, admin, {
      fetcher: fetcher as never,
      env: {
        databaseUrl: "file:./dev.db",
        sessionSecret: "secret",
        sessionCookieName: "alwaystrack_session",
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
        googleSheetsTemplateFolderId: "folder-123"
      }
    });

    expect(result.spreadsheetId).toBe("sheet-drive-1");
    expect(String(fetcher.mock.calls[1]?.[0])).toContain("/drive/v3/files");
    expect(String(fetcher.mock.calls[1]?.[1]?.body)).toContain("folder-123");
  });

  it("maps sheets permission errors to a specific Google error", async () => {
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
            error: {
              code: 403,
              message: "The caller does not have permission",
              status: "PERMISSION_DENIED"
            }
          }),
          { status: 403, headers: { "content-type": "application/json" } }
        )
      );

    await expect(
      createProfessionalsLicensesGoogleSheetTemplate(basePrisma() as never, admin, {
        fetcher: fetcher as never,
        env: {
          databaseUrl: "file:./dev.db",
          sessionSecret: "secret",
          sessionCookieName: "alwaystrack_session",
          port: 3333,
          storageProvider: "local",
          storageLocalDir: ".storage/private",
          documentMaxBytes: 1024,
          notificationProvider: "fake",
          notificationJobLimit: 25,
          documentAiProvider: "fake",
          documentAiModel: "fake",
          googleServiceAccountEmail: "service@example.com",
          googlePrivateKey: privateKey
        }
      })
    ).rejects.toMatchObject({
      code: "GOOGLE_SHEETS_PERMISSION_DENIED",
      detail: "Could not generate Google Sheet. Check Google Sheets credentials, APIs, and permissions."
    });
  });

  it("maps drive folder quota errors to a folder-specific Google error", async () => {
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
            error: {
              code: 403,
              message: "The user's Drive storage quota has been exceeded.",
              errors: [{ reason: "storageQuotaExceeded", message: "The user's Drive storage quota has been exceeded." }]
            }
          }),
          { status: 403, headers: { "content-type": "application/json" } }
        )
      );

    await expect(
      createProfessionalsLicensesGoogleSheetTemplate(basePrisma() as never, admin, {
        fetcher: fetcher as never,
        env: {
          databaseUrl: "file:./dev.db",
          sessionSecret: "secret",
          sessionCookieName: "alwaystrack_session",
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
          googleSheetsTemplateFolderId: "folder-123"
        }
      })
    ).rejects.toMatchObject({
      code: "GOOGLE_SHEETS_FOLDER_ACCESS_DENIED",
      detail: "Could not create Google Sheet in the configured Drive folder because the Drive storage quota is exceeded."
    });
  });
});
