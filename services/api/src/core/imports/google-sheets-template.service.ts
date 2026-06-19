import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import type { PrismaClient } from "@prisma/client";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv, type ApiEnv } from "../../config/env.js";
import { externalFetch } from "../integrations/external-http.js";
import { resolveGoogleTemplateAccess } from "../integrations/google/google-oauth.service.js";
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

interface DriveFileCreateResponse {
  id: string;
  webViewLink?: string;
}

interface GoogleSheetTemplateResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sharedWith: string[];
}

interface GoogleApiErrorPayload {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    errors?: Array<{ reason?: string; message?: string; domain?: string }>;
    details?: unknown[];
  };
}

interface CreateTemplateOptions {
  fetcher?: Fetcher;
  env?: ApiEnv;
  shareWithEmail?: string;
  extraShareEmails?: string[];
  shareRole?: "reader" | "writer";
}

export async function createProfessionalsLicensesGoogleSheetTemplate(
  prisma: PrismaClient,
  actor: CurrentUser,
  options?: CreateTemplateOptions
): Promise<GoogleSheetTemplateResult> {
  if (actor.role !== "ADMIN") throw new ImportError("FORBIDDEN");

  const env = options?.env ?? loadEnv();
  const fetcher = options?.fetcher ?? fetch;
  const lists = await loadProfessionalsLicensesTemplateLists(prisma, actor);
  const access = await resolveGoogleTemplateAccess(prisma, actor, env, fetcher);

  const title = `modelo-profissionais-licencas-${new Date().toISOString().slice(0, 10)}`;
  const spreadsheet =
    access.shouldCreateInFolder && env.googleSheetsTemplateFolderId
      ? await createSpreadsheetInDriveFolder(access.accessToken, title, env.googleSheetsTemplateFolderId, fetcher)
      : await createSpreadsheet(access.accessToken, title, fetcher);

  const modelSheetId = spreadsheet.sheets?.find((item) => item.properties?.title === "Modelo")?.properties?.sheetId;
  const listsSheetId = spreadsheet.sheets?.find((item) => item.properties?.title === "Listas")?.properties?.sheetId;
  if (modelSheetId === undefined || listsSheetId === undefined) {
    throw new ImportError("INVALID_INPUT", "Google Sheets response did not include Modelo/Listas sheet ids.");
  }

  await writeSheetValues(spreadsheet.spreadsheetId, access.accessToken, lists, fetcher);
  await applySheetFormatting(spreadsheet.spreadsheetId, access.accessToken, modelSheetId, listsSheetId, lists, fetcher);

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

  if (access.shouldShareWithActor) {
    await shareSpreadsheet(
      spreadsheet.spreadsheetId,
      access.accessToken,
      primaryShareEmail,
      options?.shareRole ?? "writer",
      fetcher
    );
  }
  for (const email of extraShareEmails) {
    await shareSpreadsheet(
      spreadsheet.spreadsheetId,
      access.accessToken,
      email,
      env.googleSheetsTemplateShareRole ?? "writer",
      fetcher
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

  throw new ImportError("GOOGLE_SHEETS_CREDENTIALS_MISSING", "Google Sheets credentials are missing or unreadable.");
}

export async function requestServiceAccountAccessToken(env: ApiEnv, fetcher: Fetcher = fetch) {
  const credentials = resolveCredentials(env);
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

  const response = await externalFetch(
    fetcher,
    googleTokenUrl,
    {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body
    },
    { operation: "google.sheets.serviceAccountToken", timeoutMs: 15_000 }
  );

  if (!response.ok) {
    await throwGoogleApiError("token", response);
  }

  const payload = (await response.json()) as TokenResponse;
  if (!payload.access_token) {
    throw new ImportError("GOOGLE_SHEETS_CREDENTIALS_MISSING", "Google OAuth token response did not include access_token.");
  }
  return payload.access_token;
}

async function createSpreadsheet(accessToken: string, title: string, fetcher: Fetcher) {
  const response = await externalFetch(
    fetcher,
    `${googleApiBaseUrl}/spreadsheets`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        properties: { title },
        sheets: [{ properties: { title: "Modelo" } }, { properties: { title: "Listas" } }]
      })
    },
    { operation: "google.sheets.createSpreadsheet", timeoutMs: 15_000 }
  );

  if (!response.ok) {
    await throwGoogleApiError("createSpreadsheet", response);
  }

  return (await response.json()) as SpreadsheetCreateResponse;
}

async function createSpreadsheetInDriveFolder(
  accessToken: string,
  title: string,
  folderId: string,
  fetcher: Fetcher
) {
  const createResponse = await externalFetch(
    fetcher,
    `${googleDriveBaseUrl}/files?supportsAllDrives=true&fields=id,webViewLink`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        name: title,
        mimeType: "application/vnd.google-apps.spreadsheet",
        parents: [folderId]
      })
    },
    { operation: "google.drive.createSpreadsheetInFolder", timeoutMs: 15_000 }
  );

  if (!createResponse.ok) {
    await throwGoogleApiError("createSpreadsheetInFolder", createResponse, { folderId });
  }

  const driveFile = (await createResponse.json()) as DriveFileCreateResponse;
  const metadataResponse = await externalFetch(
    fetcher,
    `${googleApiBaseUrl}/spreadsheets/${driveFile.id}`,
    {
      headers: { authorization: `Bearer ${accessToken}` }
    },
    { operation: "google.sheets.getSpreadsheetMetadata", timeoutMs: 15_000 }
  );
  if (!metadataResponse.ok) {
    await throwGoogleApiError("getSpreadsheetMetadata", metadataResponse);
  }

  const metadata = (await metadataResponse.json()) as SpreadsheetCreateResponse;
  return {
    spreadsheetId: metadata.spreadsheetId,
    spreadsheetUrl: driveFile.webViewLink ?? metadata.spreadsheetUrl ?? `https://docs.google.com/spreadsheets/d/${driveFile.id}/edit`,
    sheets: metadata.sheets
  };
}

async function writeSheetValues(
  spreadsheetId: string,
  accessToken: string,
  lists: Awaited<ReturnType<typeof loadProfessionalsLicensesTemplateLists>>,
  fetcher: Fetcher
) {
  const listMatrix = buildListsMatrix(lists);
  const response = await externalFetch(
    fetcher,
    `${googleApiBaseUrl}/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
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
    },
    { operation: "google.sheets.writeValues", timeoutMs: 15_000 }
  );

  if (!response.ok) {
    await throwGoogleApiError("writeSheetValues", response);
  }
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

  const response = await externalFetch(
    fetcher,
    `${googleApiBaseUrl}/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ requests })
    },
    { operation: "google.sheets.applyFormatting", timeoutMs: 15_000 }
  );

  if (!response.ok) {
    await throwGoogleApiError("applySheetFormatting", response);
  }
}

async function shareSpreadsheet(
  spreadsheetId: string,
  accessToken: string,
  email: string,
  role: "reader" | "commenter" | "writer",
  fetcher: Fetcher
) {
  const response = await externalFetch(
    fetcher,
    `${googleDriveBaseUrl}/files/${spreadsheetId}/permissions?supportsAllDrives=true&sendNotificationEmail=false`,
    {
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
    },
    { operation: "google.drive.shareSpreadsheet", timeoutMs: 15_000 }
  );

  if (!response.ok) {
    await throwGoogleApiError("shareSpreadsheet", response, { email });
  }
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

function normalizeEmail(value: string | null | undefined) {
  const text = value?.trim().toLowerCase() ?? "";
  if (!text) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? text : null;
}

async function throwGoogleApiError(operation: string, response: Response, metadata?: Record<string, unknown>): Promise<never> {
  const text = await response.text();
  let payload: GoogleApiErrorPayload | null = null;
  try {
    payload = text ? (JSON.parse(text) as GoogleApiErrorPayload) : null;
  } catch {
    payload = null;
  }

  const googleError = payload?.error;
  const message = googleError?.message ?? text ?? "Unknown Google API error";
  const status = googleError?.status ?? null;
  const reasons = (googleError?.errors ?? []).map((item) => item.reason).filter((value): value is string => Boolean(value));

  console.error("GOOGLE_SHEETS_ERROR", {
    operation,
    httpStatus: response.status,
    status,
    message,
    errors: googleError?.errors ?? null,
    details: googleError?.details ?? null,
    metadata: metadata ?? null
  });

  const lower = message.toLowerCase();
  if (lower.includes("api has not been used") || lower.includes("api is not enabled") || lower.includes("access not configured")) {
    throw new ImportError("GOOGLE_SHEETS_API_NOT_ENABLED", "Google Sheets or Google Drive API is not enabled for this project.");
  }
  if (response.status === 403 && operation === "createSpreadsheetInFolder") {
    if (reasons.includes("storageQuotaExceeded") || lower.includes("storage quota")) {
      throw new ImportError(
        "GOOGLE_SHEETS_FOLDER_ACCESS_DENIED",
        "Could not create Google Sheet in the configured Drive folder because the Drive storage quota is exceeded."
      );
    }
    throw new ImportError(
      "GOOGLE_SHEETS_FOLDER_ACCESS_DENIED",
      "Could not create Google Sheet in the configured Drive folder. Share the folder with the Service Account as editor."
    );
  }
  if (response.status === 403) {
    throw new ImportError(
      "GOOGLE_SHEETS_PERMISSION_DENIED",
      "Could not generate Google Sheet. Check Google Sheets credentials, APIs, and permissions."
    );
  }
  if (response.status === 401) {
    throw new ImportError("GOOGLE_SHEETS_CREDENTIALS_MISSING", "Google credentials were rejected while calling Google Sheets.");
  }
  throw new ImportError("INVALID_INPUT", `Google Sheets request failed during ${operation}.`);
}
