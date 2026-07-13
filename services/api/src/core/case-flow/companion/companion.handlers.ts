import type { Request, Response } from "express";
import type { CurrentUser } from "@alwaystrack/shared";
import { loadEnv } from "../../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { sendError, sendOk } from "../../http/responses.js";
import { ingestFacts } from "../case-flow.api.service.js";
import { authorizeCompanionMutation, CompanionTrustError, issueCompanionCredential, revokeCompanionCredential } from "./companion-trust.service.js";

const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : undefined;
const body = (request: Request) => request.body && typeof request.body === "object" && !Array.isArray(request.body) ? request.body as Record<string, unknown> : {};
const enabled = () => loadEnv().enableCompanionRuntime === true;
function failure(response: Response, error: unknown) {
  const code = error instanceof CompanionTrustError ? error.code : undefined;
  if (code === "DISABLED") return sendError(response, 404, "NOT_FOUND", "Not found.");
  if (code === "NOT_FOUND") return sendError(response, 404, code, "Companion installation not found.");
  if (code) return sendError(response, 401, code, "Companion authorization rejected.");
  return sendError(response, 400, "INVALID_INPUT", "Invalid Companion request.");
}

export const companionHandlers = {
  issue: async (request: Request, response: Response) => {
    try {
      if (!request.user) throw new CompanionTrustError("INVALID_CREDENTIAL"); const input = body(request);
      const installationId = text(input.installationId); const browserProfileId = text(input.browserProfileId); const extensionInstanceId = text(input.extensionInstanceId);
      if (!installationId || !browserProfileId || !extensionInstanceId) throw new Error("INVALID_INPUT");
      return sendOk(response, await issueCompanionCredential(prisma, request.user, { installationId, browserProfileId, extensionInstanceId }, { enabled: enabled() }), 201);
    } catch (error) { return failure(response, error); }
  },
  revoke: async (request: Request, response: Response) => {
    try { if (!request.user) throw new CompanionTrustError("INVALID_CREDENTIAL"); return sendOk(response, await revokeCompanionCredential(prisma, request.user, String(request.params.installationId ?? ""))); }
    catch (error) { return failure(response, error); }
  },
  ingestFacts: async (request: Request, response: Response) => {
    try {
      const input = body(request); const authorization = request.header("authorization") ?? ""; const credential = authorization.startsWith("Companion ") ? authorization.slice(10) : "";
      const correlation = { installationId: text(input.installationId) ?? "", userId: text(input.userId) ?? "", browserProfileId: text(input.browserProfileId) ?? "", caseId: String(request.params.caseId ?? ""), runId: String(request.params.runId ?? "") };
      const trusted = await authorizeCompanionMutation(prisma, credential, correlation, { enabled: enabled() });
      if (!Array.isArray(input.facts) || input.facts.some((fact) => !fact || typeof fact !== "object" || (fact as { caseId?: unknown }).caseId !== correlation.caseId || (fact as { connectorRunId?: unknown }).connectorRunId !== correlation.runId)) throw new CompanionTrustError("CORRELATION_MISMATCH");
      const actor = { id: trusted.actor.id, organizationId: trusted.actor.organizationId } as CurrentUser;
      return sendOk(response, await ingestFacts(prisma, actor, correlation.caseId, input.facts as never), 201);
    } catch (error) { return failure(response, error); }
  }
};
