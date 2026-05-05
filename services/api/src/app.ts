import express from "express";
import { loadEnv } from "./config/env.js";
import { attachRequestContext } from "./core/http/request-context.js";
import { sendError, sendOk } from "./core/http/responses.js";
import { listAuditLogsHandler } from "./core/audit/audit.handlers.js";
import { loginHandler, logoutHandler, meHandler } from "./core/auth/auth.handlers.js";
import { requireAuth, requireRole } from "./core/auth/auth.middleware.js";
import {
  createSectorHandler,
  createUnitHandler,
  getOrganizationHandler,
  updateOrganizationHandler,
  updateSectorHandler,
  updateUnitHandler
} from "./core/organizations/organizations.handlers.js";
import {
  createUserHandler,
  listUsersHandler,
  resetUserPasswordHandler,
  updateUserHandler
} from "./core/users/users.handlers.js";
import {
  createProfessionalHandler,
  getProfessionalHandler,
  listProfessionalsHandler,
  updateProfessionalHandler
} from "./core/professionals/professionals.handlers.js";
import {
  createLicenseHandler,
  createLicenseTypeHandler,
  listLicensesHandler,
  listLicenseTypesHandler,
  recalculateLicensesHandler,
  updateLicenseHandler,
  updateLicenseTypeHandler
} from "./core/licenses/licenses.handlers.js";
import {
  downloadDocumentHandler,
  listDocumentsHandler,
  uploadDocumentHandler,
  validateDocumentHandler
} from "./core/documents/documents.handlers.js";
import {
  analyzeDocumentHandler,
  applyDocumentAnalysisHandler,
  listDocumentAnalysesHandler
} from "./core/document-ai/document-ai.handlers.js";
import {
  createUploadTokenHandler,
  getPublicUploadTokenHandler,
  invalidateUploadTokenHandler,
  publicUploadDocumentHandler
} from "./core/documents/upload-tokens.handlers.js";
import {
  createNotificationRuleHandler,
  createNotificationTemplateHandler,
  listNotificationConfigHandler,
  manualLicenseNotificationHandler,
  metaWebhookHandler,
  processNotificationJobsHandler,
  scanNotificationJobsHandler,
  updateNotificationRuleHandler,
  updateNotificationTemplateHandler,
  verifyMetaWebhookHandler
} from "./core/notifications/notifications.handlers.js";
import {
  buildPublicHelpLinkHandler,
  createFaqItemHandler,
  listFaqItemsHandler,
  listPublicFaqItemsHandler,
  updateFaqItemHandler
} from "./core/faq/faq.handlers.js";
import { getDashboardHandler } from "./core/dashboard/dashboard.handlers.js";
import {
  areaSummaryCsvReportHandler,
  areaSummaryReportHandler,
  expiredLicensesCsvReportHandler,
  expiredLicensesReportHandler,
  expiringLicensesCsvReportHandler,
  expiringLicensesReportHandler,
  notificationsCsvReportHandler,
  notificationsReportHandler,
  pendingDocumentsCsvReportHandler,
  pendingDocumentsReportHandler,
  rejectedDocumentsCsvReportHandler,
  rejectedDocumentsReportHandler,
  regularizationCsvReportHandler,
  regularizationReportHandler,
  rtSummaryCsvReportHandler,
  rtSummaryReportHandler
} from "./core/reports/reports.handlers.js";
import {
  commitProfessionalsLicensesCsvHandler,
  professionalsLicensesTemplateHandler,
  validateProfessionalsLicensesCsvHandler
} from "./core/imports/imports.handlers.js";

export function createApp() {
  const app = express();
  const env = loadEnv();

  app.use((request, response, next) => {
    if (env.corsOrigin) {
      response.header("access-control-allow-origin", env.corsOrigin);
      response.header("access-control-allow-credentials", "true");
      response.header("access-control-allow-headers", "content-type");
      response.header("access-control-allow-methods", "GET,POST,PATCH,OPTIONS");
    }
    if (request.method === "OPTIONS") {
      return response.sendStatus(204);
    }
    return next();
  });
  app.use(express.json({ limit: "1mb" }));
  app.use(attachRequestContext);

  app.get("/health", (_request, response) => sendOk(response, { status: "ok" }));
  app.get("/v1/webhooks/meta-whatsapp", verifyMetaWebhookHandler);
  app.post("/v1/webhooks/meta-whatsapp", metaWebhookHandler);
  app.get("/v1/public-upload/:token", getPublicUploadTokenHandler);
  app.get("/v1/public-faq", listPublicFaqItemsHandler);
  app.post("/v1/public-help/wa-link", buildPublicHelpLinkHandler);
  app.post(
    "/v1/public-upload/:token",
    express.raw({ limit: "11mb", type: ["application/pdf", "image/jpeg", "image/png", "image/webp"] }),
    publicUploadDocumentHandler
  );

  app.post("/v1/auth/login", loginHandler);
  app.post("/v1/auth/logout", requireAuth, logoutHandler);
  app.get("/v1/auth/me", requireAuth, meHandler);

  app.get("/v1/audit-logs", requireAuth, requireRole(["ADMIN"]), listAuditLogsHandler);
  app.get("/v1/dashboard", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), getDashboardHandler);
  app.get("/v1/reports/licenses/expired", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), expiredLicensesReportHandler);
  app.get("/v1/reports/licenses/expired/csv", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), expiredLicensesCsvReportHandler);
  app.get("/v1/reports/licenses/expiring", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), expiringLicensesReportHandler);
  app.get("/v1/reports/licenses/expiring/csv", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), expiringLicensesCsvReportHandler);
  app.get("/v1/reports/groups/rt", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), rtSummaryReportHandler);
  app.get("/v1/reports/groups/rt/csv", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), rtSummaryCsvReportHandler);
  app.get("/v1/reports/groups/areas", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), areaSummaryReportHandler);
  app.get("/v1/reports/groups/areas/csv", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), areaSummaryCsvReportHandler);
  app.get("/v1/reports/documents/pending", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), pendingDocumentsReportHandler);
  app.get("/v1/reports/documents/pending/csv", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), pendingDocumentsCsvReportHandler);
  app.get("/v1/reports/documents/rejected", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), rejectedDocumentsReportHandler);
  app.get("/v1/reports/documents/rejected/csv", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), rejectedDocumentsCsvReportHandler);
  app.get("/v1/reports/notifications", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), notificationsReportHandler);
  app.get("/v1/reports/notifications/csv", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), notificationsCsvReportHandler);
  app.get("/v1/reports/regularization", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), regularizationReportHandler);
  app.get("/v1/reports/regularization/csv", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), regularizationCsvReportHandler);
  app.get("/v1/organization", requireAuth, requireRole(["ADMIN"]), getOrganizationHandler);
  app.patch("/v1/organization", requireAuth, requireRole(["ADMIN"]), updateOrganizationHandler);
  app.post("/v1/organization/units", requireAuth, requireRole(["ADMIN"]), createUnitHandler);
  app.patch("/v1/organization/units/:unitId", requireAuth, requireRole(["ADMIN"]), updateUnitHandler);
  app.post("/v1/organization/units/:unitId/sectors", requireAuth, requireRole(["ADMIN"]), createSectorHandler);
  app.patch("/v1/organization/sectors/:sectorId", requireAuth, requireRole(["ADMIN"]), updateSectorHandler);
  app.get("/v1/users", requireAuth, requireRole(["ADMIN"]), listUsersHandler);
  app.post("/v1/users", requireAuth, requireRole(["ADMIN"]), createUserHandler);
  app.patch("/v1/users/:userId", requireAuth, requireRole(["ADMIN"]), updateUserHandler);
  app.post("/v1/users/:userId/reset-password", requireAuth, requireRole(["ADMIN"]), resetUserPasswordHandler);
  app.get("/v1/professionals", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), listProfessionalsHandler);
  app.get("/v1/professionals/:professionalId", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), getProfessionalHandler);
  app.post("/v1/professionals", requireAuth, requireRole(["ADMIN"]), createProfessionalHandler);
  app.patch("/v1/professionals/:professionalId", requireAuth, requireRole(["ADMIN"]), updateProfessionalHandler);
  app.get(
    "/v1/imports/professionals-licenses/template",
    requireAuth,
    requireRole(["ADMIN"]),
    professionalsLicensesTemplateHandler
  );
  app.post(
    "/v1/imports/professionals-licenses/validate",
    requireAuth,
    requireRole(["ADMIN"]),
    validateProfessionalsLicensesCsvHandler
  );
  app.post(
    "/v1/imports/professionals-licenses/commit",
    requireAuth,
    requireRole(["ADMIN"]),
    commitProfessionalsLicensesCsvHandler
  );
  app.get("/v1/license-types", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), listLicenseTypesHandler);
  app.post("/v1/license-types", requireAuth, requireRole(["ADMIN"]), createLicenseTypeHandler);
  app.patch("/v1/license-types/:licenseTypeId", requireAuth, requireRole(["ADMIN"]), updateLicenseTypeHandler);
  app.get("/v1/licenses", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), listLicensesHandler);
  app.post("/v1/licenses", requireAuth, requireRole(["ADMIN"]), createLicenseHandler);
  app.post("/v1/licenses/recalculate", requireAuth, requireRole(["ADMIN"]), recalculateLicensesHandler);
  app.patch("/v1/licenses/:licenseId", requireAuth, requireRole(["ADMIN"]), updateLicenseHandler);
  app.post("/v1/upload-tokens", requireAuth, requireRole(["ADMIN"]), createUploadTokenHandler);
  app.patch("/v1/upload-tokens/:uploadTokenId/invalidate", requireAuth, requireRole(["ADMIN"]), invalidateUploadTokenHandler);
  app.get("/v1/documents", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), listDocumentsHandler);
  app.post(
    "/v1/documents",
    requireAuth,
    requireRole(["ADMIN", "RT", "SUPERVISOR"]),
    express.raw({ limit: "11mb", type: ["application/pdf", "image/jpeg", "image/png", "image/webp"] }),
    uploadDocumentHandler
  );
  app.get(
    "/v1/documents/:documentId/download",
    requireAuth,
    requireRole(["ADMIN", "RT", "SUPERVISOR"]),
    downloadDocumentHandler
  );
  app.patch(
    "/v1/documents/:documentId/validation",
    requireAuth,
    requireRole(["ADMIN", "RT"]),
    validateDocumentHandler
  );
  app.post("/v1/documents/:documentId/analyze", requireAuth, requireRole(["ADMIN", "RT"]), analyzeDocumentHandler);
  app.get("/v1/documents/:documentId/analysis", requireAuth, requireRole(["ADMIN", "RT"]), listDocumentAnalysesHandler);
  app.post("/v1/documents/:documentId/analysis/apply", requireAuth, requireRole(["ADMIN", "RT"]), applyDocumentAnalysisHandler);
  app.get("/v1/notifications/config", requireAuth, requireRole(["ADMIN"]), listNotificationConfigHandler);
  app.post("/v1/notifications/templates", requireAuth, requireRole(["ADMIN"]), createNotificationTemplateHandler);
  app.patch(
    "/v1/notifications/templates/:templateId",
    requireAuth,
    requireRole(["ADMIN"]),
    updateNotificationTemplateHandler
  );
  app.post("/v1/notifications/rules", requireAuth, requireRole(["ADMIN"]), createNotificationRuleHandler);
  app.patch("/v1/notifications/rules/:ruleId", requireAuth, requireRole(["ADMIN"]), updateNotificationRuleHandler);
  app.post("/v1/notifications/scan", requireAuth, requireRole(["ADMIN"]), scanNotificationJobsHandler);
  app.post("/v1/notifications/process", requireAuth, requireRole(["ADMIN"]), processNotificationJobsHandler);
  app.post("/v1/notifications/manual-license", requireAuth, requireRole(["ADMIN"]), manualLicenseNotificationHandler);
  app.get("/v1/faq", requireAuth, requireRole(["ADMIN"]), listFaqItemsHandler);
  app.post("/v1/faq", requireAuth, requireRole(["ADMIN"]), createFaqItemHandler);
  app.patch("/v1/faq/:faqItemId", requireAuth, requireRole(["ADMIN"]), updateFaqItemHandler);

  app.use((_request, response) => sendError(response, 404, "NOT_FOUND", "Route not found."));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error(error);
    return sendError(response, 500, "INTERNAL_ERROR", "Unexpected server error.");
  });

  return app;
}
