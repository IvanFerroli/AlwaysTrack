import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { isInputValidationError, sendInputValidationError } from "../validation/input-validation.js";
import {
  createPersonalScript,
  createOperationalScript,
  createOperationalScriptSuggestion,
  createScriptPack,
  createScriptCategory,
  decideOperationalScriptSuggestion,
  decideSmartScriptItem,
  exportSmartScriptEspanso,
  getSmartScriptMetrics,
  importSmartScriptCandidates,
  listScriptLibrary,
  listPersonalScripts,
  listSmartScriptItems,
  obsoleteOperationalScript,
  parseOperationalScriptInput,
  parseScriptCategoryInput,
  parseScriptCopyInput,
  parseSmartScriptDecisionPayload,
  parseSmartScriptImportPayload,
  parseSmartScriptListFilters,
  parseScriptFilters,
  parseScriptPackInput,
  parseScriptSuggestionInput,
  parsePersonalScriptInput,
  recertifyOperationalScript,
  recordSmartScriptUse,
  recordScriptCopy,
  restoreOperationalScriptRevision,
  ScriptLibraryError,
  suggestSmartScriptItemAsCanonical,
  suggestPersonalScriptAsCanonical,
  updateScriptPack,
  updateOperationalScript,
  validateOperationalScript
} from "./script-library.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) throw new ScriptLibraryError("FORBIDDEN");
  return request.user;
}

function sendScriptError(response: Response, error: unknown) {
  if (isInputValidationError(error)) return sendInputValidationError(response);
  if (error instanceof ScriptLibraryError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Script resource not found.");
    if (error.code === "SLUG_TAKEN") return sendError(response, 409, "SLUG_TAKEN", "Category slug already exists.");
    if (error.code === "TITLE_TAKEN") return sendError(response, 409, "TITLE_TAKEN", "Script or category already exists.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid script library payload.");
  }
  throw error;
}

export async function listScriptLibraryHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listScriptLibrary(prisma, actorFrom(request), parseScriptFilters(request.query)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function listPersonalScriptsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listPersonalScripts(prisma, actorFrom(request)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function createPersonalScriptHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createPersonalScript(prisma, actorFrom(request), parsePersonalScriptInput(request.body)), 201);
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function suggestPersonalScriptHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await suggestPersonalScriptAsCanonical(prisma, actorFrom(request), routeParam(request.params.personalScriptId)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function listSmartScriptItemsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listSmartScriptItems(prisma, actorFrom(request), parseSmartScriptListFilters(request.query)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function importSmartScriptCandidatesHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await importSmartScriptCandidates(prisma, actorFrom(request), parseSmartScriptImportPayload(request.body)), 201);
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function decideSmartScriptItemHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await decideSmartScriptItem(prisma, actorFrom(request), routeParam(request.params.smartScriptItemId), parseSmartScriptDecisionPayload(request.body)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function exportSmartScriptEspansoHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await exportSmartScriptEspanso(prisma, actorFrom(request)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function getSmartScriptMetricsHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await getSmartScriptMetrics(prisma, actorFrom(request)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function recordSmartScriptUseHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await recordSmartScriptUse(prisma, actorFrom(request), routeParam(request.params.smartScriptItemId)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function suggestSmartScriptCanonicalHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await suggestSmartScriptItemAsCanonical(prisma, actorFrom(request), routeParam(request.params.smartScriptItemId)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function createScriptCategoryHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createScriptCategory(prisma, actorFrom(request), parseScriptCategoryInput(request.body)), 201);
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function createScriptPackHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createScriptPack(prisma, actorFrom(request), parseScriptPackInput(request.body)), 201);
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function updateScriptPackHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await updateScriptPack(prisma, actorFrom(request), routeParam(request.params.packId), parseScriptPackInput(request.body)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function createOperationalScriptHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createOperationalScript(prisma, actorFrom(request), parseOperationalScriptInput(request.body)), 201);
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function createOperationalScriptSuggestionHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await createOperationalScriptSuggestion(prisma, actorFrom(request), parseScriptSuggestionInput(request.body)), 201);
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function decideOperationalScriptSuggestionHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await decideOperationalScriptSuggestion(prisma, actorFrom(request), routeParam(request.params.suggestionId), parseScriptSuggestionInput(request.body)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function updateOperationalScriptHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await updateOperationalScript(prisma, actorFrom(request), routeParam(request.params.scriptId), parseOperationalScriptInput(request.body)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function validateOperationalScriptHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await validateOperationalScript(prisma, actorFrom(request), routeParam(request.params.scriptId)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function obsoleteOperationalScriptHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await obsoleteOperationalScript(prisma, actorFrom(request), routeParam(request.params.scriptId)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function recertifyOperationalScriptHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await recertifyOperationalScript(prisma, actorFrom(request), routeParam(request.params.scriptId), parseOperationalScriptInput(request.body)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function restoreOperationalScriptRevisionHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await restoreOperationalScriptRevision(prisma, actorFrom(request), routeParam(request.params.scriptId), routeParam(request.params.revisionId)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}

export async function copyOperationalScriptHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await recordScriptCopy(prisma, actorFrom(request), routeParam(request.params.scriptId), parseScriptCopyInput(request.body)));
  } catch (error) {
    return sendScriptError(response, error);
  }
}
