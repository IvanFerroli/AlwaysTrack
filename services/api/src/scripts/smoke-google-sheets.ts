import { loadEnv } from "../config/env.js";
import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";

const googleTokenUrl = "https://oauth2.googleapis.com/token";
const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const driveScope = "https://www.googleapis.com/auth/drive.file";

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function resolveCredentials() {
  const env = loadEnv();
  if (env.googleServiceAccountEmail && env.googlePrivateKey) {
    return {
      clientEmail: env.googleServiceAccountEmail,
      privateKey: env.googlePrivateKey.replace(/\\n/g, "\n"),
      folderId: env.googleSheetsTemplateFolderId ?? null
    };
  }

  const path = env.googleApplicationCredentials;
  if (path && existsSync(path)) {
    const raw = JSON.parse(readFileSync(path, "utf8")) as {
      client_email?: string;
      private_key?: string;
      project_id?: string;
    };
    if (raw.client_email && raw.private_key) {
      return {
        clientEmail: raw.client_email,
        privateKey: raw.private_key,
        folderId: env.googleSheetsTemplateFolderId ?? null,
        projectId: raw.project_id ?? null
      };
    }
  }

  throw new Error("Google credentials not found.");
}

async function getAccessToken(clientEmail: string, privateKey: string) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const jwtPayload = {
    iss: clientEmail,
    scope: `${sheetsScope} ${driveScope}`,
    aud: googleTokenUrl,
    iat: now,
    exp: now + 3600
  };
  const signer = createSign("RSA-SHA256");
  signer.update(`${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(jwtPayload))}`);
  signer.end();
  const signature = signer.sign(privateKey);
  const assertion = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(jwtPayload))}.${base64Url(signature)}`;

  const response = await fetch(googleTokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion
    })
  });
  const text = await response.text();
  const payload = JSON.parse(text || "{}") as {
    access_token?: string;
    token_type?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  console.log(
    "TOKEN_STATUS",
    JSON.stringify(
      {
        ok: response.ok,
        status: response.status,
        hasAccessToken: Boolean(payload.access_token),
        tokenType: payload.token_type ?? null,
        expiresIn: payload.expires_in ?? null,
        error: payload.error ?? null,
        errorDescription: payload.error_description ?? null
      },
      null,
      2
    )
  );
  if (!response.ok) process.exit(1);
  if (!payload.access_token) {
    throw new Error("Google OAuth token response did not include access_token.");
  }
  return payload.access_token;
}

async function trySheetsCreate(accessToken: string) {
  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      properties: { title: `smoke-sylembra-${Date.now()}` },
      sheets: [{ properties: { title: "Modelo" } }, { properties: { title: "Listas" } }]
    })
  });
  const text = await response.text();
  console.log("SHEETS_CREATE_RESPONSE", response.status, text);
}

async function tryDriveCreate(accessToken: string, folderId: string) {
  const response = await fetch("https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,webViewLink", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      name: `smoke-sylembra-folder-${Date.now()}`,
      mimeType: "application/vnd.google-apps.spreadsheet",
      parents: [folderId]
    })
  });
  const text = await response.text();
  console.log("DRIVE_CREATE_RESPONSE", response.status, text);
}

async function main() {
  const credentials = resolveCredentials();
  console.log(
    JSON.stringify(
      {
        clientEmail: credentials.clientEmail,
        projectId: "projectId" in credentials ? credentials.projectId ?? null : null,
        hasFolderId: Boolean(credentials.folderId)
      },
      null,
      2
    )
  );
  const accessToken = await getAccessToken(credentials.clientEmail, credentials.privateKey);
  await trySheetsCreate(accessToken);
  if (credentials.folderId) {
    await tryDriveCreate(accessToken, credentials.folderId);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
