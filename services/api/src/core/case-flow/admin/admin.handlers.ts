import type { Request, Response } from "express";
import { prisma } from "../../db/prisma.js";
import { sendError, sendOk } from "../../http/responses.js";
import { CaseFlowAdminError, createHeuristicRuleVersion, exportCaseFlowConfig, getAdminCase, listAdminCases, listConnectorAdmin, listHeuristicRules, restoreCaseFlowConfig, updateConnectorAdmin } from "./admin.service.js";

const param = (value: string | string[] | undefined) => typeof value === "string" ? value : "";
const actor = (request: Request) => { if (!request.user) throw new CaseFlowAdminError("FORBIDDEN"); return request.user; };
function handle(response: Response, error: unknown) {
  if (!(error instanceof CaseFlowAdminError)) throw error;
  const status = error.code === "FORBIDDEN" ? 403 : error.code === "NOT_FOUND" ? 404 : error.code === "CONFLICT" ? 409 : 400;
  return sendError(response, status, error.code, error.code === "FORBIDDEN" ? "Admin access required." : "Invalid CaseFlow admin request.");
}
function run(response: Response, operation: () => Promise<unknown>, status = 200) { return operation().then((result) => sendOk(response, result, status)).catch((error) => handle(response, error)); }

export const caseFlowAdminHandlers = {
  cases: (req: Request, res: Response) => run(res, () => listAdminCases(prisma, actor(req), { status: typeof req.query.status === "string" ? req.query.status : undefined, page: Number(req.query.page) || undefined, pageSize: Number(req.query.pageSize) || undefined })),
  caseDetail: (req: Request, res: Response) => run(res, () => getAdminCase(prisma, actor(req), param(req.params.caseId))),
  rules: (req: Request, res: Response) => run(res, () => listHeuristicRules(prisma, actor(req))),
  createRuleVersion: (req: Request, res: Response) => run(res, () => createHeuristicRuleVersion(prisma, actor(req), req.body), 201),
  connectors: (req: Request, res: Response) => run(res, () => listConnectorAdmin(prisma, actor(req))),
  updateConnector: (req: Request, res: Response) => run(res, () => updateConnectorAdmin(prisma, actor(req), param(req.params.connectorId), req.body)),
  exportConfig: (req: Request, res: Response) => run(res, () => exportCaseFlowConfig(prisma, actor(req))),
  restoreConfig: (req: Request, res: Response) => run(res, () => restoreCaseFlowConfig(prisma, actor(req), req.body), 201)
};
