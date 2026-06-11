import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  createSector,
  createUnit,
  getOrganizationSettings,
  getOrganizationTree,
  OrganizationError,
  parseOrganizationSettingsUpdate,
  parseOrganizationUpdate,
  parseSectorInput,
  parseUnitInput,
  updateCurrentOrganization,
  updateOrganizationSettings,
  updateSector,
  updateUnit
} from "./organizations.service.js";

function actorFrom(request: Request) {
  if (!request.user) {
    throw new OrganizationError("NOT_FOUND");
  }
  return {
    id: request.user.id,
    organizationId: request.user.organizationId
  };
}

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function sendOrganizationError(response: Response, error: unknown) {
  if (error instanceof OrganizationError) {
    if (error.code === "NOT_FOUND") {
      return sendError(response, 404, "NOT_FOUND", "Resource not found.");
    }
    return sendError(response, 400, "INVALID_INPUT", "Invalid organization payload.");
  }

  throw error;
}

export async function getOrganizationHandler(request: Request, response: Response) {
  try {
    const organization = await getOrganizationTree(prisma, actorFrom(request));
    return sendOk(response, { organization });
  } catch (error) {
    return sendOrganizationError(response, error);
  }
}

export async function updateOrganizationHandler(request: Request, response: Response) {
  try {
    const organization = await updateCurrentOrganization(prisma, actorFrom(request), parseOrganizationUpdate(request.body));
    return sendOk(response, { organization });
  } catch (error) {
    return sendOrganizationError(response, error);
  }
}

export async function getOrganizationSettingsHandler(request: Request, response: Response) {
  try {
    const settings = await getOrganizationSettings(prisma, actorFrom(request));
    return sendOk(response, settings);
  } catch (error) {
    return sendOrganizationError(response, error);
  }
}

export async function updateOrganizationSettingsHandler(request: Request, response: Response) {
  try {
    const organization = await updateOrganizationSettings(prisma, actorFrom(request), parseOrganizationSettingsUpdate(request.body));
    return sendOk(response, { organization });
  } catch (error) {
    return sendOrganizationError(response, error);
  }
}

export async function createUnitHandler(request: Request, response: Response) {
  try {
    const unit = await createUnit(prisma, actorFrom(request), parseUnitInput(request.body));
    return sendOk(response, { unit }, 201);
  } catch (error) {
    return sendOrganizationError(response, error);
  }
}

export async function updateUnitHandler(request: Request, response: Response) {
  try {
    const unit = await updateUnit(prisma, actorFrom(request), routeParam(request.params.unitId), parseUnitInput(request.body));
    return sendOk(response, { unit });
  } catch (error) {
    return sendOrganizationError(response, error);
  }
}

export async function createSectorHandler(request: Request, response: Response) {
  try {
    const unitId = routeParam(request.params.unitId);
    const sector = await createSector(prisma, actorFrom(request), { ...parseSectorInput(request.body), unitId });
    return sendOk(response, { sector }, 201);
  } catch (error) {
    return sendOrganizationError(response, error);
  }
}

export async function updateSectorHandler(request: Request, response: Response) {
  try {
    const sector = await updateSector(
      prisma,
      actorFrom(request),
      routeParam(request.params.sectorId),
      parseSectorInput(request.body)
    );
    return sendOk(response, { sector });
  } catch (error) {
    return sendOrganizationError(response, error);
  }
}
