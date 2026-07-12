import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { EvidenceFactError } from "./evidence.service.js";
import { createManualEvidence } from "./manual-evidence.service.js";
import { HumanOverrideError } from "./overrides.service.js";

const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
function body(value: unknown): Record<string, unknown> { if (!value || typeof value !== "object" || Array.isArray(value)) throw new HumanOverrideError("INVALID_INPUT"); return value as Record<string, unknown>; }
function requiredText(value: unknown) { if (typeof value !== "string" || !value.trim()) throw new HumanOverrideError("INVALID_INPUT"); return value.trim(); }

export function createManualEvidenceHandler(db = prisma) {
  return async (request: Request, response: Response) => {
    if (!request.user) return sendError(response, 401, "UNAUTHENTICATED", "Login required.");
    try {
      const input = body(request.body);
      const observedAt = input.observedAt ? new Date(requiredText(input.observedAt)) : undefined;
      if (observedAt && Number.isNaN(observedAt.getTime())) throw new HumanOverrideError("INVALID_INPUT");
      return sendOk(response, await createManualEvidence(db, request.user, param(request.params.caseId), {
        key: requiredText(input.key), value: input.value as never, normalizedValue: input.normalizedValue as never,
        reason: requiredText(input.reason), cause: input.cause as never, observedAt,
        confidence: input.confidence as number | undefined, freshness: input.freshness as never, sensitivity: input.sensitivity as never,
        recompute: input.recompute === true
      }), 201);
    } catch (error) {
      const code = error instanceof HumanOverrideError || error instanceof EvidenceFactError ? error.code : undefined;
      if (code === "NOT_FOUND") return sendError(response, 404, code, "Case not found.");
      if (code) return sendError(response, 400, code, "Invalid manual evidence.");
      throw error;
    }
  };
}

export const manualEvidenceHandler = createManualEvidenceHandler();
