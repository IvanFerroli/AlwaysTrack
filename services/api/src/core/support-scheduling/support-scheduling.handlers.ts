import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  SupportSchedulingError,
  acceptSupportShiftOffer,
  archiveSupportScheduleRuleDraft,
  archiveSupportScheduleRuleVersion,
  assignSupportShiftPattern,
  cancelSupportShiftOffer,
  claimSupportExtraShiftSlot,
  createSupportExtraShiftSlot,
  createSupportScheduleRuleDraft,
  createSupportScheduleRuleVersion,
  createSupportShiftOffer,
  createSupportShiftPatternVersion,
  decideSupportExtraShiftClaim,
  decideSupportShiftOffer,
  listSupportScheduleCalendar,
  listSupportSchedulePlanning,
  materializeSupportShiftOccurrences,
  previewSupportScheduleRuleDraft,
  publishSupportScheduleRuleDraft,
  updateSupportScheduleRuleDraft,
} from "./support-scheduling.service.js";

function actor(request: Request) {
  if (!request.user) throw new SupportSchedulingError("FORBIDDEN");
  return request.user;
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function param(value: unknown) {
  const parsed = text(value);
  if (!parsed) throw new SupportSchedulingError("INVALID_INPUT");
  return parsed;
}

function failure(response: Response, error: unknown) {
  if (!(error instanceof SupportSchedulingError)) {
    return sendError(
      response,
      500,
      "SUPPORT_SCHEDULING_FAILED",
      "Falha na operação de Escalas SAC.",
    );
  }
  const status =
    error.code === "NOT_FOUND"
      ? 404
      : error.code === "FORBIDDEN"
        ? 403
        : error.code === "CONFLICT"
          ? 409
          : error.code === "RULE_VIOLATION"
            ? 422
            : 400;
  const message =
    error.code === "FORBIDDEN"
      ? "Ação não permitida para este perfil ou escopo."
      : error.code === "NOT_FOUND"
        ? "Entidade de Escalas não encontrada."
        : error.code === "CONFLICT"
          ? "A operação conflita com o estado atual da Escala."
          : error.code === "RULE_VIOLATION"
            ? "A operação viola as regras vigentes de jornada."
            : "Dados inválidos para a operação de Escalas.";
  return sendError(response, status, error.code, message);
}

export async function listSupportScheduleCalendarHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await listSupportScheduleCalendar(prisma, actor(request), {
        from: param(request.query.from),
        to: param(request.query.to),
        scope: text(request.query.scope)?.toUpperCase() as
          "SELF" | "TEAM" | undefined,
        teamId: text(request.query.teamId),
        userId: text(request.query.userId),
      }),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function listSupportSchedulePlanningHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await listSupportSchedulePlanning(prisma, actor(request), {
        teamId: param(request.query.teamId),
      }),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function createSupportScheduleRuleVersionHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await createSupportScheduleRuleVersion(
        prisma,
        actor(request),
        request.body,
      ),
      201,
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function createSupportScheduleRuleDraftHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await createSupportScheduleRuleDraft(
        prisma,
        actor(request),
        request.body,
      ),
      201,
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function updateSupportScheduleRuleDraftHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await updateSupportScheduleRuleDraft(
        prisma,
        actor(request),
        param(request.params.draftId),
        request.body,
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function previewSupportScheduleRuleDraftHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await previewSupportScheduleRuleDraft(
        prisma,
        actor(request),
        param(request.params.draftId),
        request.body,
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function publishSupportScheduleRuleDraftHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await publishSupportScheduleRuleDraft(
        prisma,
        actor(request),
        param(request.params.draftId),
        request.body,
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function archiveSupportScheduleRuleDraftHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await archiveSupportScheduleRuleDraft(
        prisma,
        actor(request),
        param(request.params.draftId),
        request.body,
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function archiveSupportScheduleRuleVersionHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await archiveSupportScheduleRuleVersion(
        prisma,
        actor(request),
        param(request.params.ruleId),
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function createSupportShiftPatternVersionHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await createSupportShiftPatternVersion(
        prisma,
        actor(request),
        request.body,
      ),
      201,
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function assignSupportShiftPatternHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await assignSupportShiftPattern(prisma, actor(request), request.body),
      201,
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function materializeSupportShiftOccurrencesHandler(
  request: Request,
  response: Response,
) {
  try {
    const body =
      request.body && typeof request.body === "object"
        ? (request.body as Record<string, unknown>)
        : {};
    return sendOk(
      response,
      await materializeSupportShiftOccurrences(prisma, actor(request), {
        teamId: param(body.teamId),
        from: param(body.from),
        to: param(body.to),
        dryRun: body.dryRun === true,
      }),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function createSupportExtraShiftSlotHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await createSupportExtraShiftSlot(prisma, actor(request), request.body),
      201,
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function claimSupportExtraShiftSlotHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await claimSupportExtraShiftSlot(
        prisma,
        actor(request),
        param(request.params.slotId),
        request.body ?? {},
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function decideSupportExtraShiftClaimHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await decideSupportExtraShiftClaim(
        prisma,
        actor(request),
        param(request.params.claimId),
        request.body,
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function createSupportShiftOfferHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await createSupportShiftOffer(prisma, actor(request), request.body),
      201,
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function acceptSupportShiftOfferHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await acceptSupportShiftOffer(
        prisma,
        actor(request),
        param(request.params.offerId),
        request.body ?? {},
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function decideSupportShiftOfferHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await decideSupportShiftOffer(
        prisma,
        actor(request),
        param(request.params.offerId),
        request.body,
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}

export async function cancelSupportShiftOfferHandler(
  request: Request,
  response: Response,
) {
  try {
    return sendOk(
      response,
      await cancelSupportShiftOffer(
        prisma,
        actor(request),
        param(request.params.offerId),
        request.body ?? {},
      ),
    );
  } catch (error) {
    return failure(response, error);
  }
}
