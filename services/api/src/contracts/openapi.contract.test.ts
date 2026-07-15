import { readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import path from "node:path";
import { evidenceAcquisitionMethods, evidenceFreshnesses, evidenceSensitivities, serviceCaseStatuses, userRoles } from "@alwaystrack/shared";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { findUnsafeExamples, listP0Operations, listRuntimeRoutes, validateP0Contract, validateReferencesAndExamples, type OpenApiDocument } from "./openapi.js";

const root = path.resolve(import.meta.dirname, "../../../..");
const document = JSON.parse(readFileSync(path.join(root, "docs/api/openapi.v1.yaml"), "utf8")) as OpenApiDocument;
const app = createApp();
let server: Server;
let baseUrl = "";

beforeAll(async () => {
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Contract test server did not bind to loopback");
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

describe("versioned HTTP OpenAPI contract", () => {
  it("matches every P0 operation to the real Express route, auth middleware and statuses", () => {
    expect(validateP0Contract(document, listRuntimeRoutes(app))).toEqual([]);
  });

  it("keeps examples free from real-looking personal data and credentials", () => {
    expect(findUnsafeExamples(document)).toEqual([]);
  });

  it("resolves every local reference and validates documented examples against their schemas", () => {
    expect(validateReferencesAndExamples(document)).toEqual([]);
  });

  it("reuses canonical shared enums instead of drifting into parallel HTTP types", () => {
    const schemas = (document as OpenApiDocument & { components: { schemas: Record<string, { enum?: string[]; properties?: Record<string, { enum?: string[] }> }> } }).components.schemas;
    const evidence = schemas.EvidenceFactInput.properties ?? {};
    expect(schemas.UserRole.enum).toEqual(userRoles);
    expect(schemas.ServiceCaseStatus.enum).toEqual(serviceCaseStatuses);
    expect(evidence.freshness.enum).toEqual(evidenceFreshnesses);
    expect(evidence.sensitivity.enum).toEqual(evidenceSensitivities);
    expect(evidence.acquisition.enum).toEqual(evidenceAcquisitionMethods);
  });

  it("returns the documented unauthenticated envelope before protected handlers reach persistence", async () => {
    const protectedOperations = listP0Operations(document).filter(({ operation }) =>
      operation.security?.some((requirement) => Object.hasOwn(requirement, "sessionCookie"))
    );
    for (const { method, path: contractPath } of protectedOperations) {
      const requestPath = contractPath.replace(/\{[^}]+\}/g, "contract-fixture");
      const response = await fetch(`${baseUrl}${requestPath}`, {
        method: method.toUpperCase(),
        headers: { "content-type": "application/json", origin: "http://localhost:5173" },
        body: method === "get" || method === "delete" ? undefined : "{}"
      });
      expect(response.status, `${method.toUpperCase()} ${contractPath}`).toBe(401);
      expect(await response.json(), `${method.toUpperCase()} ${contractPath}`).toEqual({
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "Login required." }
      });
    }
  });
});
