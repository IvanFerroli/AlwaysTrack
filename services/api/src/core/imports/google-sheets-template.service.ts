import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@sylembra/shared";
import { loadEnv, type ApiEnv } from "../../config/env.js";
import {
  ImportError,
  loadProfessionalsLicensesTemplateLists,
  professionalsLicensesImportHeaders
} from "./professionals-licenses-import.service.js";

const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleSheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const googleDriveScope = "https://www.googleapis.com/auth/drive.file";
const googleApiBaseUrl = "https://sheets.googleapis.com/v4";
const googleDriveBaseUrl = "https://www.googleapis.com/drive/v3";

type Fetcher = typeof fetch;

interface GoogleServiceAccountCredentials {
  clientEmail: string;
  privateKey: string;
}

interface TokenResponse {
  access_token: string;
}

interface SpreadsheetCreateResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
}

interface GoogleSheetTemplateResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sharedWith: string[];
}

export async function createProfessionalsLicensesGoogleSheetTemplate(
  prisma: PrismaClient,
  actor: CurrentUser,
  options?: {
    fetcher?: Fetcher;
    env?: ApiEnv;
    shareWithEmail?: string;
    extraShareEmails?: string[];
    shareRole?: "reader" | "writer";
  }
): Promise<GoogleSheetTemplateResult> {
  if (actor.role !== "ADMIN") throw new ImportError("FORBIDDEN");

  const env = options?.env ?? loadEnv();
  const credentials = resolveCredentials(env);
  const lists = await loadProfessionalsLicensesTemplateLists(prisma, actor);
  const accessToken = await requestAccessToken(credentials, options?.fetcher ?? fetch);

  const title = `modelo-profissionais-licencas-${new Date().toISOString().slice(0, 10)}`;
  const spreadsheet = await createSpreadsheet(accessToken, title, options?.fetcher ?? fetch);

  const modelSheetId = spreadsheet.sheets?.find((item) => item.properties?.title === "Modelo")?.properties?.sheetId;
  const listsSheetId = spreadsheet.sheets?.find((item) => item.properties?.title === "Listas")?.properties?.sheetId;

  if (modelSheetId === undefined || listsSheetId === undefined) {
    throw new ImportError("INVALID_INPUT");
  }

  await writeSheetValues(spreadsheet.spreadsheetId, accessToken, lists, options?.fetcher ?? fetch);
  await applySheetFormatting(spreadsheet.spreadsheetId, accessToken, modelSheetId, listsSheetId, lists, options?.fetcher ?? fetch);

  const primaryShareEmail = normalizeEmail(options?.shareWithEmail ?? actor.email);
  if (!primaryShareEmail) {
    throw new ImportError("INVALID_INPUT", "Authenticated user does not have a valid email for Google Sheets sharing.");
  }

  const extraShareEmails = [
    ...new Set(
      [options?.extraShareEmails ?? [], env.googleSheetsTemplateShareEmail ? [env.googleSheetsTemplateShareEmail] : []]
        .flat()
        .map(normalizeEmail)
        .filter((value): value is string => Boolean(value) && value !== primaryShareEmail)
    )
  ];

  try {
    await shareSpreadsheet(
      spreadsheet.spreadsheetId,
      accessToken,
      primaryShareEmail,
      options?.shareRole ?? "writer",
      options?.fetcher ?? fetch
    );
    for (const email of extraShareEmails) {
      await shareSpreadsheet(
        spreadsheet.spreadsheetId,
        accessToken,
        email,
        env.googleSheetsTemplateShareRole ?? "writer",
        options?.fetcher ?? fetch
      );
    }
  } catch {
    throw new ImportError(
      "INVALID_INPUT",
      "Google Sheet was created, but it could not be shared with the authenticated user email."
    );
  }

  return {
    spreadsheetId: spreadsheet.spreadsheetId,
    spreadsheetUrl: spreadsheet.spreadsheetUrl,
    sharedWith: [primaryShareEmail, ...extraShareEmails]
  };
}

function resolveCredentials(env: ApiEnv): GoogleServiceAccountCredentials {
  if (env.googleServiceAccountEmail && env.googlePrivateKey) {
    return {
      clientEmail: env.googleServiceAccountEmail,
      privateKey: env.googlePrivateKey.replace(/\\n/g, "\n")
    };
  }

  if (env.googleApplicationCredentials && existsSync(env.googleApplicationCredentials)) {
    const raw = JSON.parse(readFileSync(env.googleApplicationCredentials, "utf8")) as {
      client_email?: string;
      private_key?: string;
    };
    if (raw.client_email && raw.private_key) {
      return {
        clientEmail: raw.client_email,
        privateKey: raw.private_key
      };
    }
  }

  throw new ImportError("NOT_CONFIGURED");
}

async function requestAccessToken(credentials: GoogleServiceAccountCredentials, fetcher: Fetcher) {
  const now = Math.floor(Date.now() / 1000);
  const assertion = signJwt(
    { alg: "RS256", typ: "JWT" },
    {
      iss: credentials.clientEmail,
      scope: `${googleSheetsScope} ${googleDriveScope}`,
      aud: googleTokenUrl,
      iat: now,
      exp: now + 3600
    },
    credentials.privateKey
  );

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion
  });

  const response = await fetcher(googleTokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body
  });

  if (!response.ok) throw new ImportError("INVALID_INPUT");
  const payload = (await response.json()) as TokenResponse;
  if (!payload.access_token) throw new ImportError("INVALID_INPUT");
  return payload.access_token;
}

async function createSpreadsheet(accessToken: string, title: string, fetcher: Fetcher) {
  const response = await fetcher(`${googleApiBaseUrl}/spreadsheets`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [{ properties: { title: "Modelo" } }, { properties: { title: "Listas" } }]
    })
  });

  if (!response.ok) throw new ImportError("INVALID_INPUT");
  return (await response.json()) as SpreadsheetCreateResponse;
}

async function writeSheetValues(
  spreadsheetId: string,
  accessToken: string,
  lists: Awaited<ReturnType<typeof loadProfessionalsLicensesTemplateLists>>,
  fetcher: Fetcher
) {
  const listMatrix = buildListsMatrix(lists);
  const response = await fetcher(`${googleApiBaseUrl}/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      valueInputOption: "RAW",
      data: [
        {
          range: `Modelo!A1:${columnLetter(professionalsLicensesImportHeaders.length)}1`,
          values: [Array.from(professionalsLicensesImportHeaders)]
        },
        {
          range: `Listas!A1:E${listMatrix.length}`,
          values: listMatrix
        }
      ]
    })
  });

  if (!response.ok) throw new ImportError("INVALID_INPUT");
}

async function applySheetFormatting(
  spreadsheetId: string,
  accessToken: string,
  modelSheetId: number,
  listsSheetId: number,
  lists: Awaited<ReturnType<typeof loadProfessionalsLicensesTemplateLists>>,
  fetcher: Fetcher
) {
  const requests = [
    {
      updateSheetProperties: {
        properties: { sheetId: modelSheetId, gridProperties: { frozenRowCount: 1 } },
        fields: "gridProperties.frozenRowCount"
      }
    },
    {
      updateSheetProperties: {
        properties: { sheetId: listsSheetId, hidden: true },
        fields: "hidden"
      }
    },
    {
      repeatCell: {
        range: { sheetId: modelSheetId, startRowIndex: 0, endRowIndex: 1 },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.89, green: 0.95, blue: 0.98 },
            textFormat: { bold: true }
          }
        },
        fields: "userEnteredFormat(backgroundColor,textFormat)"
      }
    },
    ...buildValidationRequests(modelSheetId, lists)
  ];

  const response = await fetcher(`${googleApiBaseUrl}/spreadsheets/${spreadsheetId}:batchUpdate`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ requests })
  });

  if (!response.ok) throw new ImportError("INVALID_INPUT");
}

async function shareSpreadsheet(
  spreadsheetId: string,
  accessToken: string,
  email: string,
  role: "reader" | "commenter" | "writer",
  fetcher: Fetcher
) {
  const response = await fetcher(`${googleDriveBaseUrl}/files/${spreadsheetId}/permissions?sendNotificationEmail=false`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      type: "user",
      role,
      emailAddress: email
    })
  });

  if (!response.ok) throw new ImportError("INVALID_INPUT");
}

function normalizeEmail(value: string | null | undefined) {
  const text = value?.trim().toLowerCase() ?? "";
  if (!text) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
}

function buildListsMatrix(lists: Awaited<ReturnType<typeof loadProfessionalsLicensesTemplateLists>>) {
  const columns = [
    { header: "unit_name", values: lists.units.map((item) => item.name) },
    { header: "sector_name", values: lists.sectors.map((item) => item.name) },
    { header: "rt_email", values: lists.rtUsers.map((item) => item.email) },
    { header: "license_type", values: lists.licenseTypes.map((item) => item.name) },
    { header: "status", values: lists.statuses }
  ];
  const totalRows = Math.max(...columns.map((column) => Math.max(column.values.length, 1))) + 1;

  return Array.from({ length: totalRows }, (_, rowIndex) =>
    columns.map((column) => {
      if (rowIndex === 0) return column.header;
      return column.values[rowIndex - 1] ?? "";
    })
  );
}

function buildValidationRequests(
  modelSheetId: number,
  lists: Awaited<ReturnType<typeof loadProfessionalsLicensesTemplateLists>>
) {
  return [
    createValidationRequest(modelSheetId, 5, "A", lists.units.length),
    createValidationRequest(modelSheetId, 6, "B", lists.sectors.length),
    createValidationRequest(modelSheetId, 7, "C", lists.rtUsers.length),
    createValidationRequest(modelSheetId, 8, "D", lists.licenseTypes.length),
    createValidationRequest(modelSheetId, 14, "E", lists.statuses.length)
  ];
}

function createValidationRequest(modelSheetId: number, columnIndex: number, listColumn: string, valuesLength: number) {
  const endRow = Math.max(valuesLength + 1, 2);
  return {
    setDataValidation: {
      range: {
        sheetId: modelSheetId,
        startRowIndex: 1,
        endRowIndex: 501,
        startColumnIndex: columnIndex,
        endColumnIndex: columnIndex + 1
      },
      rule: {
        condition: {
          type: "ONE_OF_RANGE",
          values: [{ userEnteredValue: `=Listas!$${listColumn}$2:$${listColumn}$${endRow}` }]
        },
        strict: true,
        showCustomUi: true
      }
    }
  };
}

function signJwt(header: object, payload: object, privateKey: string) {
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signer = createSign("RSA-SHA256");
  signer.update(`${encodedHeader}.${encodedPayload}`);
  signer.end();
  const signature = signer.sign(privateKey);
  return `${encodedHeader}.${encodedPayload}.${base64Url(signature)}`;
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function columnLetter(index: number) {
  let current = index;
  let result = "";
  while (current > 0) {
    const remainder = (current - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    current = Math.floor((current - 1) / 26);
  }
  return result;
}
