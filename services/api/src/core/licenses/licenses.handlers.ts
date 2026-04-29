import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  createLicense,
  createLicenseType,
  LicenseManagementError,
  listLicenses,
  listLicenseTypes,
  parseLicenseFilters,
  parseLicenseInput,
  parseLicenseTypeInput,
  updateLicense,
  updateLicenseType
} from "./licenses.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) {
    throw new LicenseManagementError("FORBIDDEN");
  }
  return request.user;
}

function sendLicenseError(response: Response, error: unknown) {
  if (error instanceof LicenseManagementError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "License resource not found.");
    if (error.code === "LICENSE_TYPE_TAKEN") {
      return sendError(response, 409, "LICENSE_TYPE_TAKEN", "License type already exists.");
    }
    if (error.code === "LICENSE_NUMBER_TAKEN") {
      return sendError(response, 409, "LICENSE_NUMBER_TAKEN", "License number already exists for this professional/type.");
    }
    return sendError(response, 400, "INVALID_INPUT", "Invalid license payload.");
  }

  throw error;
}

export async function listLicenseTypesHandler(request: Request, response: Response) {
  try {
    const result = await listLicenseTypes(prisma, actorFrom(request));
    return sendOk(response, result);
  } catch (error) {
    return sendLicenseError(response, error);
  }
}

export async function createLicenseTypeHandler(request: Request, response: Response) {
  try {
    const licenseType = await createLicenseType(prisma, actorFrom(request), parseLicenseTypeInput(request.body));
    return sendOk(response, { licenseType }, 201);
  } catch (error) {
    return sendLicenseError(response, error);
  }
}

export async function updateLicenseTypeHandler(request: Request, response: Response) {
  try {
    const licenseType = await updateLicenseType(
      prisma,
      actorFrom(request),
      routeParam(request.params.licenseTypeId),
      parseLicenseTypeInput(request.body)
    );
    return sendOk(response, { licenseType });
  } catch (error) {
    return sendLicenseError(response, error);
  }
}

export async function listLicensesHandler(request: Request, response: Response) {
  try {
    const result = await listLicenses(prisma, actorFrom(request), parseLicenseFilters(request.query));
    return sendOk(response, result);
  } catch (error) {
    return sendLicenseError(response, error);
  }
}

export async function createLicenseHandler(request: Request, response: Response) {
  try {
    const license = await createLicense(prisma, actorFrom(request), parseLicenseInput(request.body));
    return sendOk(response, { license }, 201);
  } catch (error) {
    return sendLicenseError(response, error);
  }
}

export async function updateLicenseHandler(request: Request, response: Response) {
  try {
    const license = await updateLicense(
      prisma,
      actorFrom(request),
      routeParam(request.params.licenseId),
      parseLicenseInput(request.body)
    );
    return sendOk(response, { license });
  } catch (error) {
    return sendLicenseError(response, error);
  }
}
