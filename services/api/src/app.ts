import express from "express";
import {
  adminOnlyRoles,
  commercialAllRoles,
  commercialKnowledgeContributorRoles,
  commercialManagerRoles,
  commercialReviewerRoles
} from "@alwaystrack/shared";
import { loadEnv } from "./config/env.js";
import { attachRequestContext } from "./core/http/request-context.js";
import { sendError, sendOk } from "./core/http/responses.js";
import { httpMetricsHandler, httpMetricsMiddleware } from "./core/diagnostics/http-metrics.js";
import { operationalObservabilityHandler } from "./core/diagnostics/operational-observability.handlers.js";
import { listAuditLogsHandler } from "./core/audit/audit.handlers.js";
import {
  googleLoginCallbackHandler,
  googleLoginStartHandler,
  googleLoginStatusHandler,
  loginHandler,
  logoutHandler,
  meHandler
} from "./core/auth/auth.handlers.js";
import { requireAuth, requireRole } from "./core/auth/auth.middleware.js";
import {
  createSectorHandler,
  createUnitHandler,
  getOrganizationHandler,
  getOrganizationSettingsHandler,
  updateOrganizationHandler,
  updateOrganizationSettingsHandler,
  updateSectorHandler,
  updateUnitHandler
} from "./core/organizations/organizations.handlers.js";
import {
  createUserHandler,
  getProfileHandler,
  listCommercialUserOptionsHandler,
  listUsersHandler,
  resetUserPasswordHandler,
  updateProfileHandler,
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
  listInAppNotificationsHandler,
  listNotificationConfigHandler,
  markAllInAppNotificationsReadHandler,
  markInAppNotificationReadHandler,
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
  addFaqCommentHandler,
  createFaqThreadHandler,
  listFaqItemsHandler,
  listFaqThreadsHandler,
  listPublicFaqItemsHandler,
  promoteFaqThreadToWikiHandler,
  setFaqReactionHandler,
  updateFaqThreadStatusHandler,
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
  professionalsLicensesGoogleSheetTemplateHandler,
  professionalsLicensesTemplateHandler,
  professionalsLicensesWorkbookHandler,
  validateProfessionalsLicensesCsvHandler
} from "./core/imports/imports.handlers.js";
import {
  googleIntegrationDisconnectHandler,
  googleIntegrationStatusHandler,
  googleOauthCallbackHandler,
  googleOauthStartHandler
} from "./core/integrations/google/google.handlers.js";
import {
  archiveWikiPageHandler,
  approveWikiEditRequestHandler,
  createWikiEditRequestHandler,
  createWikiPageHandler,
  getWikiPageHandler,
  getWikiAttachmentFileHandler,
  heartbeatWikiPresenceHandler,
  getWikiPageBySlugHandler,
  listWikiEditRequestsHandler,
  listWikiPagesHandler,
  markWikiReadHandler,
  rejectWikiEditRequestHandler,
  restoreWikiRevisionHandler,
  unarchiveWikiPageHandler,
  updateWikiPageHandler,
  uploadWikiAttachmentHandler
} from "./core/wiki/wiki.handlers.js";
import { operationalTodayHandler } from "./core/operations/operations.handlers.js";
import { globalSearchHandler } from "./core/search/search.handlers.js";
import {
  acknowledgeAnnouncementHandler,
  archiveAnnouncementHandler,
  createAnnouncementHandler,
  getAnnouncementBySlugHandler,
  listAnnouncementsHandler,
  publishAnnouncementHandler,
  updateAnnouncementHandler
} from "./core/announcements/announcements.handlers.js";
import {
  copyOperationalScriptHandler,
  createOperationalScriptHandler,
  createScriptCategoryHandler,
  listScriptLibraryHandler,
  obsoleteOperationalScriptHandler,
  updateOperationalScriptHandler,
  recertifyOperationalScriptHandler,
  restoreOperationalScriptRevisionHandler,
  validateOperationalScriptHandler
} from "./core/script-library/script-library.handlers.js";
import {
  analyzeSalesDocumentHandler,
  createRankingSnapshotHandler,
  createSalesCampaignHandler,
  salesDashboardCsvHandler,
  getRankingSnapshotJobStatusHandler,
  listSalesCampaignsHandler,
  listRankingSnapshotsHandler,
  listSalesDocumentsHandler,
  listSalesSellersHandler,
  reviewSalesDocumentHandler,
  salesDocumentDiagnosticsHandler,
  salesDocumentManualCorrectionHandler,
  salesDocumentTimelineHandler,
  salesRankingCsvHandler,
  salesRankingExplanationHandler,
  salesRankingHandler,
  salesDashboardHandler,
  salesStatementsCsvHandler,
  salesStatementsHandler,
  updateSalesCampaignHandler,
  uploadSalesDocumentHandler
} from "./core/sales-documents/sales-documents.handlers.js";

export function createApp() {
  const app = express();
  const env = loadEnv();

  app.use((request, response, next) => {
    if (env.corsOrigin) {
      response.header("access-control-allow-origin", env.corsOrigin);
      response.header("access-control-allow-credentials", "true");
      response.header("access-control-allow-headers", "content-type,x-file-name");
      response.header("access-control-allow-methods", "GET,POST,PATCH,DELETE,OPTIONS");
    }
    if (request.method === "OPTIONS") {
      return response.sendStatus(204);
    }
    return next();
  });
  app.get("/health", (_request, response) => sendOk(response, { status: "ok" }));
  app.get("/v1/webhooks/meta-whatsapp", verifyMetaWebhookHandler);
  app.post("/v1/webhooks/meta-whatsapp", express.raw({ limit: "1mb", type: ["application/json", "application/*+json"] }), metaWebhookHandler);

  app.use(express.json({ limit: "1mb" }));
  app.use(attachRequestContext);
  app.use(httpMetricsMiddleware);

  if (env.enableLegacySylembra) {
    app.get("/v1/public-upload/:token", getPublicUploadTokenHandler);
    app.get("/v1/public-faq", listPublicFaqItemsHandler);
    app.post("/v1/public-help/wa-link", buildPublicHelpLinkHandler);
    app.post(
      "/v1/public-upload/:token",
      express.raw({ limit: "11mb", type: ["application/pdf", "image/jpeg", "image/png", "image/webp"] }),
      publicUploadDocumentHandler
    );
  }

  app.post("/v1/auth/login", loginHandler);
  app.get("/v1/auth/google/status", googleLoginStatusHandler);
  app.get("/v1/auth/google/start", googleLoginStartHandler);
  app.get("/v1/auth/google/callback", googleLoginCallbackHandler);
  app.post("/v1/auth/logout", requireAuth, logoutHandler);
  app.get("/v1/auth/me", requireAuth, meHandler);
  app.get("/v1/profile", requireAuth, getProfileHandler);
  app.patch("/v1/profile", requireAuth, updateProfileHandler);
  app.get("/v1/integrations/google/oauth/callback", googleOauthCallbackHandler);

  app.get("/v1/audit-logs", requireAuth, requireRole(adminOnlyRoles), listAuditLogsHandler);
  app.get("/v1/diagnostics/http-metrics", requireAuth, requireRole(adminOnlyRoles), httpMetricsHandler);
  app.get("/v1/diagnostics/operations", requireAuth, requireRole(adminOnlyRoles), operationalObservabilityHandler);
  app.get("/v1/search", requireAuth, requireRole(commercialAllRoles), globalSearchHandler);
  app.get("/v1/announcements", requireAuth, requireRole(commercialAllRoles), listAnnouncementsHandler);
  app.post("/v1/announcements", requireAuth, requireRole(commercialManagerRoles), createAnnouncementHandler);
  app.get("/v1/announcements/by-slug/:slug", requireAuth, requireRole(commercialAllRoles), getAnnouncementBySlugHandler);
  app.patch("/v1/announcements/:announcementId", requireAuth, requireRole(commercialManagerRoles), updateAnnouncementHandler);
  app.post("/v1/announcements/:announcementId/publish", requireAuth, requireRole(commercialManagerRoles), publishAnnouncementHandler);
  app.post("/v1/announcements/:announcementId/archive", requireAuth, requireRole(commercialManagerRoles), archiveAnnouncementHandler);
  app.post("/v1/announcements/:announcementId/acknowledge", requireAuth, requireRole(commercialAllRoles), acknowledgeAnnouncementHandler);
  app.get("/v1/script-library", requireAuth, requireRole(commercialAllRoles), listScriptLibraryHandler);
  app.post("/v1/script-library/categories", requireAuth, requireRole(commercialManagerRoles), createScriptCategoryHandler);
  app.post("/v1/script-library/scripts", requireAuth, requireRole(commercialManagerRoles), createOperationalScriptHandler);
  app.patch("/v1/script-library/scripts/:scriptId", requireAuth, requireRole(commercialManagerRoles), updateOperationalScriptHandler);
  app.post("/v1/script-library/scripts/:scriptId/validate", requireAuth, requireRole(commercialManagerRoles), validateOperationalScriptHandler);
  app.post("/v1/script-library/scripts/:scriptId/obsolete", requireAuth, requireRole(commercialManagerRoles), obsoleteOperationalScriptHandler);
  app.post("/v1/script-library/scripts/:scriptId/recertify", requireAuth, requireRole(commercialManagerRoles), recertifyOperationalScriptHandler);
  app.post("/v1/script-library/scripts/:scriptId/revisions/:revisionId/restore", requireAuth, requireRole(adminOnlyRoles), restoreOperationalScriptRevisionHandler);
  app.post("/v1/script-library/scripts/:scriptId/copy", requireAuth, requireRole(commercialAllRoles), copyOperationalScriptHandler);
  if (env.enableLegacySylembra) {
    app.get("/v1/dashboard", requireAuth, requireRole(["ADMIN", "RT", "SUPERVISOR"]), getDashboardHandler);
  }
  app.get("/v1/sales/dashboard", requireAuth, requireRole(commercialAllRoles), salesDashboardHandler);
  app.get("/v1/operations/today", requireAuth, requireRole(commercialAllRoles), operationalTodayHandler);
  app.get("/v1/sales/dashboard.csv", requireAuth, requireRole(commercialAllRoles), salesDashboardCsvHandler);
  app.get("/v1/sales/campaigns", requireAuth, requireRole(commercialAllRoles), listSalesCampaignsHandler);
  app.post("/v1/sales/campaigns", requireAuth, requireRole(commercialManagerRoles), express.json(), createSalesCampaignHandler);
  app.get("/v1/sales/campaigns/snapshots", requireAuth, requireRole(commercialAllRoles), listRankingSnapshotsHandler);
  app.patch("/v1/sales/campaigns/:campaignId", requireAuth, requireRole(commercialManagerRoles), express.json(), updateSalesCampaignHandler);
  app.post("/v1/sales/campaigns/:campaignId/snapshots", requireAuth, requireRole(commercialManagerRoles), createRankingSnapshotHandler);
  app.get("/v1/sales/campaigns/:campaignId/snapshots/job", requireAuth, requireRole(commercialManagerRoles), getRankingSnapshotJobStatusHandler);
  app.get("/v1/sales/ranking", requireAuth, requireRole(commercialAllRoles), salesRankingHandler);
  app.get("/v1/sales/ranking/:sellerProfileId/explanation", requireAuth, requireRole(commercialAllRoles), salesRankingExplanationHandler);
  app.get("/v1/sales/ranking.csv", requireAuth, requireRole(commercialAllRoles), salesRankingCsvHandler);
  app.get("/v1/sales/sellers", requireAuth, requireRole(commercialAllRoles), listSalesSellersHandler);
  app.get("/v1/sales/statements", requireAuth, requireRole(commercialAllRoles), salesStatementsHandler);
  app.get("/v1/sales/statements.csv", requireAuth, requireRole(commercialAllRoles), salesStatementsCsvHandler);
  app.get("/v1/sales/documents", requireAuth, requireRole(commercialAllRoles), listSalesDocumentsHandler);
  app.post(
    "/v1/sales/documents",
    requireAuth,
    requireRole(commercialAllRoles),
    express.raw({ limit: "11mb", type: ["application/pdf", "application/xml", "text/xml", "image/jpeg", "image/png", "image/webp"] }),
    uploadSalesDocumentHandler
  );
  app.get("/v1/sales/documents/:documentId/diagnostics", requireAuth, requireRole(commercialAllRoles), salesDocumentDiagnosticsHandler);
  app.get("/v1/sales/documents/:documentId/timeline", requireAuth, requireRole(commercialAllRoles), salesDocumentTimelineHandler);
  app.patch("/v1/sales/documents/:documentId/manual-correction", requireAuth, requireRole(commercialReviewerRoles), express.json(), salesDocumentManualCorrectionHandler);
  app.post("/v1/sales/documents/:documentId/analyze", requireAuth, requireRole(commercialAllRoles), analyzeSalesDocumentHandler);
  app.patch("/v1/sales/documents/:documentId/review", requireAuth, requireRole(commercialReviewerRoles), reviewSalesDocumentHandler);
  app.get("/v1/faq/threads", requireAuth, requireRole(commercialAllRoles), listFaqThreadsHandler);
  app.post("/v1/faq/threads", requireAuth, requireRole(commercialAllRoles), createFaqThreadHandler);
  app.post("/v1/faq/threads/:threadId/comments", requireAuth, requireRole(commercialAllRoles), addFaqCommentHandler);
  app.patch("/v1/faq/threads/:threadId/status", requireAuth, requireRole(commercialManagerRoles), updateFaqThreadStatusHandler);
  app.post("/v1/faq/threads/:threadId/reactions", requireAuth, requireRole(commercialAllRoles), setFaqReactionHandler);
  app.post("/v1/faq/threads/:threadId/promote-to-wiki", requireAuth, requireRole(commercialManagerRoles), promoteFaqThreadToWikiHandler);
  app.get("/v1/in-app-notifications", requireAuth, requireRole(commercialAllRoles), listInAppNotificationsHandler);
  app.post("/v1/in-app-notifications/read-all", requireAuth, requireRole(commercialAllRoles), markAllInAppNotificationsReadHandler);
  app.post("/v1/in-app-notifications/:notificationId/read", requireAuth, requireRole(commercialAllRoles), markInAppNotificationReadHandler);
  if (env.enableLegacySylembra) {
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
  }
  app.get("/v1/organization", requireAuth, requireRole(adminOnlyRoles), getOrganizationHandler);
  app.patch("/v1/organization", requireAuth, requireRole(adminOnlyRoles), updateOrganizationHandler);
  app.get("/v1/organization/settings", requireAuth, requireRole(adminOnlyRoles), getOrganizationSettingsHandler);
  app.patch("/v1/organization/settings", requireAuth, requireRole(adminOnlyRoles), updateOrganizationSettingsHandler);
  app.post("/v1/organization/units", requireAuth, requireRole(adminOnlyRoles), createUnitHandler);
  app.patch("/v1/organization/units/:unitId", requireAuth, requireRole(adminOnlyRoles), updateUnitHandler);
  app.post("/v1/organization/units/:unitId/sectors", requireAuth, requireRole(adminOnlyRoles), createSectorHandler);
  app.patch("/v1/organization/sectors/:sectorId", requireAuth, requireRole(adminOnlyRoles), updateSectorHandler);
  app.get("/v1/users", requireAuth, requireRole(adminOnlyRoles), listUsersHandler);
  app.get("/v1/users/commercial-options", requireAuth, requireRole(adminOnlyRoles), listCommercialUserOptionsHandler);
  app.post("/v1/users", requireAuth, requireRole(adminOnlyRoles), createUserHandler);
  app.patch("/v1/users/:userId", requireAuth, requireRole(adminOnlyRoles), updateUserHandler);
  app.post("/v1/users/:userId/reset-password", requireAuth, requireRole(adminOnlyRoles), resetUserPasswordHandler);
  app.get("/v1/integrations/google/status", requireAuth, requireRole(adminOnlyRoles), googleIntegrationStatusHandler);
  app.get("/v1/integrations/google/oauth/start", requireAuth, requireRole(adminOnlyRoles), googleOauthStartHandler);
  app.delete("/v1/integrations/google", requireAuth, requireRole(adminOnlyRoles), googleIntegrationDisconnectHandler);
  if (env.enableLegacySylembra) {
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
    app.get(
      "/v1/imports/professionals-licenses/template.xlsx",
      requireAuth,
      requireRole(["ADMIN"]),
      professionalsLicensesWorkbookHandler
    );
    app.get(
      "/v1/imports/professionals-licenses/template/google-sheet",
      requireAuth,
      requireRole(["ADMIN"]),
      professionalsLicensesGoogleSheetTemplateHandler
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
  }
  app.get("/v1/wiki/pages", requireAuth, requireRole(commercialAllRoles), listWikiPagesHandler);
  app.post("/v1/wiki/pages", requireAuth, requireRole(adminOnlyRoles), createWikiPageHandler);
  app.get("/v1/wiki/pages/by-slug/:slug", requireAuth, requireRole(commercialAllRoles), getWikiPageBySlugHandler);
  app.get("/v1/wiki/pages/:pageId", requireAuth, requireRole(commercialAllRoles), getWikiPageHandler);
  app.patch("/v1/wiki/pages/:pageId", requireAuth, requireRole(adminOnlyRoles), updateWikiPageHandler);
  app.post("/v1/wiki/pages/:pageId/archive", requireAuth, requireRole(adminOnlyRoles), archiveWikiPageHandler);
  app.post("/v1/wiki/pages/:pageId/unarchive", requireAuth, requireRole(adminOnlyRoles), unarchiveWikiPageHandler);
  app.post("/v1/wiki/pages/:pageId/revisions/:revisionId/restore", requireAuth, requireRole(adminOnlyRoles), restoreWikiRevisionHandler);
  app.post("/v1/wiki/pages/:pageId/read", requireAuth, requireRole(commercialAllRoles), markWikiReadHandler);
  app.post("/v1/wiki/pages/:pageId/presence", requireAuth, requireRole(commercialAllRoles), heartbeatWikiPresenceHandler);
  app.post(
    "/v1/wiki/attachments",
    requireAuth,
    requireRole(commercialAllRoles),
    express.raw({ limit: "11mb", type: ["image/jpeg", "image/png", "image/webp"] }),
    uploadWikiAttachmentHandler
  );
  app.get("/v1/wiki/attachments/:attachmentId/file", requireAuth, requireRole(commercialAllRoles), getWikiAttachmentFileHandler);
  app.get("/v1/wiki/edit-requests", requireAuth, requireRole(commercialAllRoles), listWikiEditRequestsHandler);
  app.post("/v1/wiki/edit-requests", requireAuth, requireRole(commercialKnowledgeContributorRoles), createWikiEditRequestHandler);
  app.post("/v1/wiki/edit-requests/:requestId/approve", requireAuth, requireRole(adminOnlyRoles), approveWikiEditRequestHandler);
  app.post("/v1/wiki/edit-requests/:requestId/reject", requireAuth, requireRole(adminOnlyRoles), rejectWikiEditRequestHandler);
  app.get("/v1/faq", requireAuth, requireRole(adminOnlyRoles), listFaqItemsHandler);
  app.post("/v1/faq", requireAuth, requireRole(adminOnlyRoles), createFaqItemHandler);
  app.patch("/v1/faq/:faqItemId", requireAuth, requireRole(adminOnlyRoles), updateFaqItemHandler);

  app.use((_request, response) => sendError(response, 404, "NOT_FOUND", "Route not found."));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error(error);
    return sendError(response, 500, "INTERNAL_ERROR", "Unexpected server error.");
  });

  return app;
}
