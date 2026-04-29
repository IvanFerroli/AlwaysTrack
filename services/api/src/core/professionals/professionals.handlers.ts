import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  createProfessional,
  getProfessional,
  listProfessionals,
  parseProfessionalFilters,
  parseProfessionalInput,
  ProfessionalError,
  updateProfessional
} from "./professionals.service.js";

function routeParam(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function actorFrom(request: Request) {
  if (!request.user) {
    throw new ProfessionalError("FORBIDDEN");
  }
  return request.user;
}

function sendProfessionalError(response: Response, error: unknown) {
  if (error instanceof ProfessionalError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "NOT_FOUND") return sendError(response, 404, "NOT_FOUND", "Professional not found.");
    if (error.code === "CPF_TAKEN") return sendError(response, 409, "CPF_TAKEN", "CPF already exists.");
    if (error.code === "USER_LINKED") return sendError(response, 409, "USER_LINKED", "User already linked.");
    return sendError(response, 400, "INVALID_INPUT", "Invalid professional payload.");
  }

  throw error;
}

export async function listProfessionalsHandler(request: Request, response: Response) {
  try {
    const result = await listProfessionals(prisma, actorFrom(request), parseProfessionalFilters(request.query));
    return sendOk(response, result);
  } catch (error) {
    return sendProfessionalError(response, error);
  }
}

export async function getProfessionalHandler(request: Request, response: Response) {
  try {
    const professional = await getProfessional(prisma, actorFrom(request), routeParam(request.params.professionalId));
    return sendOk(response, { professional });
  } catch (error) {
    return sendProfessionalError(response, error);
  }
}

export async function createProfessionalHandler(request: Request, response: Response) {
  try {
    const professional = await createProfessional(prisma, actorFrom(request), parseProfessionalInput(request.body));
    return sendOk(response, { professional }, 201);
  } catch (error) {
    return sendProfessionalError(response, error);
  }
}

export async function updateProfessionalHandler(request: Request, response: Response) {
  try {
    const professional = await updateProfessional(
      prisma,
      actorFrom(request),
      routeParam(request.params.professionalId),
      parseProfessionalInput(request.body)
    );
    return sendOk(response, { professional });
  } catch (error) {
    return sendProfessionalError(response, error);
  }
}
