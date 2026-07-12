import type { Request, Response } from "express";
import { serviceCaseStatuses } from "@alwaystrack/shared";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { CaseFlowLifecycleError } from "./cases.service.js";
import { EvidenceFactError } from "./evidence.service.js";
import { CaseFlowApiError, addIntake, createCase, getCase, getConflicts, getFacts, ingestFacts, updateCase, type CaseFlowSourceInput } from "./case-flow.api.service.js";

type Dependencies = Pick<typeof prisma, "serviceCase" | "serviceCaseSource" | "evidenceFact" | "evidenceConflict" | "connectorRun" | "auditLog" | "$transaction">;
const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
function actor(request: Request) { if (!request.user) throw new CaseFlowApiError("NOT_FOUND"); return request.user; }
function object(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new CaseFlowApiError("INVALID_INPUT"); return value as Record<string, unknown>; }
function text(value: unknown, required = true) { if (value === undefined && !required) return undefined; if (typeof value !== "string" || !value.trim()) throw new CaseFlowApiError("INVALID_INPUT"); return value.trim(); }
function date(value: unknown) { const parsed = new Date(text(value)!); if (Number.isNaN(parsed.getTime())) throw new CaseFlowApiError("INVALID_INPUT"); return parsed; }
function source(value: unknown): CaseFlowSourceInput {
  const item = object(value);
  return { kind: text(item.kind)!, sourceReference: text(item.sourceReference)!, sourceUrl: text(item.sourceUrl, false), observedAt: date(item.observedAt), metadata: item.metadata as never };
}
function fact(value: unknown) {
  const item = object(value);
  return { key: text(item.key)!, value: item.value as never, normalizedValue: item.normalizedValue as never, sourceSystem: text(item.sourceSystem)!, sourceReference: text(item.sourceReference, false), observedAt: date(item.observedAt), collectedAt: item.collectedAt === undefined ? undefined : date(item.collectedAt), confidence: item.confidence as number, freshness: item.freshness as never, sensitivity: item.sensitivity as never, acquisition: item.acquisition as never, connectorRunId: text(item.connectorRunId, false), ruleId: text(item.ruleId, false) };
}
function handle(response: Response, error: unknown) {
  const code = error instanceof CaseFlowApiError || error instanceof CaseFlowLifecycleError || error instanceof EvidenceFactError ? error.code : undefined;
  if (code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Case not found.");
  if (code === "IDEMPOTENCY_CONFLICT") return sendError(response, 409, code, "Idempotency key conflicts with existing evidence.");
  if (code) return sendError(response, 400, code, "Invalid CaseFlow request.");
  throw error;
}

export function createCaseFlowHandlers(db: Dependencies = prisma) {
  return {
    create: async (req: Request, res: Response) => { try { const body = object(req.body); return sendOk(res, await createCase(db as never, actor(req), { summary: text(body.summary, false), source: body.source === undefined ? undefined : source(body.source) }), 201); } catch (e) { return handle(res, e); } },
    get: async (req: Request, res: Response) => { try { return sendOk(res, await getCase(db as never, actor(req), param(req.params.caseId))); } catch (e) { return handle(res, e); } },
    patch: async (req: Request, res: Response) => { try { const body = object(req.body); const status = body.status === undefined ? undefined : text(body.status)!; if (status && !serviceCaseStatuses.includes(status as never)) throw new CaseFlowApiError("INVALID_INPUT"); return sendOk(res, await updateCase(db as never, actor(req), param(req.params.caseId), { summary: body.summary === null ? null : text(body.summary, false), status: status as never, reason: text(body.reason, false) })); } catch (e) { return handle(res, e); } },
    intake: async (req: Request, res: Response) => { try { return sendOk(res, await addIntake(db as never, actor(req), param(req.params.caseId), source(req.body)), 201); } catch (e) { return handle(res, e); } },
    addFacts: async (req: Request, res: Response) => { try { const body = object(req.body); if (!Array.isArray(body.facts)) throw new CaseFlowApiError("INVALID_INPUT"); return sendOk(res, await ingestFacts(db as never, actor(req), param(req.params.caseId), body.facts.map(fact)), 201); } catch (e) { return handle(res, e); } },
    facts: async (req: Request, res: Response) => { try { return sendOk(res, await getFacts(db as never, actor(req), param(req.params.caseId))); } catch (e) { return handle(res, e); } },
    conflicts: async (req: Request, res: Response) => { try { return sendOk(res, await getConflicts(db as never, actor(req), param(req.params.caseId))); } catch (e) { return handle(res, e); } }
  };
}

export const caseFlowHandlers = createCaseFlowHandlers();
