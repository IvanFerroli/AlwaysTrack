import express from "express";
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
  createUploadTokenHandler,
  getPublicUploadTokenHandler,
  invalidateUploadTokenHandler,
  publicUploadDocumentHandler
} from "./core/documents/upload-tokens.handlers.js";

export function createApp() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(attachRequestContext);

  app.get("/health", (_request, response) => sendOk(response, { status: "ok" }));
  app.get("/v1/public-upload/:token", getPublicUploadTokenHandler);
  app.post(
    "/v1/public-upload/:token",
    express.raw({ limit: "11mb", type: ["application/pdf", "image/jpeg", "image/png", "image/webp"] }),
    publicUploadDocumentHandler
  );

  app.post("/v1/auth/login", loginHandler);
  app.post("/v1/auth/logout", requireAuth, logoutHandler);
  app.get("/v1/auth/me", requireAuth, meHandler);

  app.get("/v1/audit-logs", requireAuth, requireRole(["ADMIN"]), listAuditLogsHandler);
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

  app.use((_request, response) => sendError(response, 404, "NOT_FOUND", "Route not found."));

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    console.error(error);
    return sendError(response, 500, "INTERNAL_ERROR", "Unexpected server error.");
  });

  return app;
}
