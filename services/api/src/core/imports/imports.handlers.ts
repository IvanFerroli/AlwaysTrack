import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  buildProfessionalsLicensesWorkbook,
  commitProfessionalsLicensesCsv,
  ImportError,
  professionalsLicensesCsvTemplate,
  validateProfessionalsLicensesCsv
} from "./professionals-licenses-import.service.js";

function actorFrom(request: Request) {
  if (!request.user) {
    throw new ImportError("FORBIDDEN");
  }
  return request.user;
}

function csvFrom(request: Request) {
  const csv = (request.body as { csv?: unknown } | undefined)?.csv;
  return typeof csv === "string" ? csv : "";
}

function sendImportError(response: Response, error: unknown) {
  if (error instanceof ImportError) {
    if (error.code === "FORBIDDEN") return sendError(response, 403, "FORBIDDEN", "Access denied.");
    if (error.code === "HAS_ERRORS") {
      return sendError(response, 409, "IMPORT_HAS_ERRORS", "CSV has blocking errors. Validate and fix before importing.");
    }
    return sendError(response, 400, "INVALID_INPUT", "Invalid CSV import payload.");
  }

  throw error;
}

export function professionalsLicensesTemplateHandler(_request: Request, response: Response) {
  response.header("content-type", "text/csv; charset=utf-8");
  response.header("content-disposition", 'attachment; filename="modelo-profissionais-licencas.csv"');
  return response.status(200).send(professionalsLicensesCsvTemplate);
}

export async function professionalsLicensesWorkbookHandler(request: Request, response: Response) {
  try {
    const workbook = await buildProfessionalsLicensesWorkbook(prisma, actorFrom(request));
    response.header(
      "content-type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    response.header("content-disposition", 'attachment; filename="modelo-profissionais-licencas.xlsx"');
    return response.status(200).send(Buffer.from(workbook));
  } catch (error) {
    return sendImportError(response, error);
  }
}

export async function validateProfessionalsLicensesCsvHandler(request: Request, response: Response) {
  try {
    const result = await validateProfessionalsLicensesCsv(prisma, actorFrom(request), csvFrom(request));
    return sendOk(response, result);
  } catch (error) {
    return sendImportError(response, error);
  }
}

export async function commitProfessionalsLicensesCsvHandler(request: Request, response: Response) {
  try {
    const result = await commitProfessionalsLicensesCsv(prisma, actorFrom(request), csvFrom(request));
    return sendOk(response, result, 201);
  } catch (error) {
    return sendImportError(response, error);
  }
}
