import { beforeEach, describe, expect, it, vi } from "vitest";
import { InputValidationError } from "../validation/input-validation.js";
import { jsonEnvelope, requestHandler } from "../../test-support/http-handler-harness.js";

const service = vi.hoisted(() => ({
  createNotificationRule: vi.fn(),
  createNotificationTemplate: vi.fn(),
  handleMetaWebhook: vi.fn(),
  listInAppNotifications: vi.fn(),
  listNotificationConfig: vi.fn(),
  markAllInAppNotificationsRead: vi.fn(),
  markInAppNotificationRead: vi.fn(),
  parseListInAppNotificationsInput: vi.fn((query) => query),
  parseManualLicenseNotificationInput: vi.fn((body) => body),
  parseNotificationRuleInput: vi.fn((body) => body),
  parseNotificationScanInput: vi.fn((body) => body),
  parseNotificationTemplateInput: vi.fn((body) => body),
  processNotificationJobs: vi.fn(),
  scanNotificationJobs: vi.fn(),
  sendManualLicenseNotification: vi.fn(),
  updateNotificationRule: vi.fn(),
  updateNotificationTemplate: vi.fn(),
  verifyWebhookChallenge: vi.fn()
}));
const provider = vi.hoisted(() => ({ getNotificationProvider: vi.fn(() => ({ name: "fake" })) }));
const targetResolver = vi.hoisted(() => ({ resolveInAppNotificationTarget: vi.fn() }));

vi.mock("../db/prisma.js", () => ({ prisma: { mocked: true } }));
vi.mock("./provider.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./provider.js")>()),
  ...provider
}));
vi.mock("./notifications.service.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./notifications.service.js")>()),
  ...service
}));
vi.mock("./notification-target-resolver.js", () => targetResolver);

import {
  createNotificationRuleHandler,
  createNotificationTemplateHandler,
  listInAppNotificationsHandler,
  listNotificationConfigHandler,
  manualLicenseNotificationHandler,
  markAllInAppNotificationsReadHandler,
  markInAppNotificationReadHandler,
  metaWebhookHandler,
  processNotificationJobsHandler,
  resolveInAppNotificationTargetHandler,
  scanNotificationJobsHandler,
  updateNotificationRuleHandler,
  updateNotificationTemplateHandler,
  verifyMetaWebhookHandler
} from "./notifications.handlers.js";
import { NotificationError } from "./notifications.service.js";

describe("notification HTTP handlers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const mock of [
      service.createNotificationRule,
      service.createNotificationTemplate,
      service.handleMetaWebhook,
      service.listInAppNotifications,
      service.listNotificationConfig,
      service.markAllInAppNotificationsRead,
      service.markInAppNotificationRead,
      service.processNotificationJobs,
      service.scanNotificationJobs,
      service.sendManualLicenseNotification,
      service.updateNotificationRule,
      service.updateNotificationTemplate
    ]) mock.mockResolvedValue({ id: "notification-result" });
    targetResolver.resolveInAppNotificationTarget.mockResolvedValue({ target: { status: "AVAILABLE", href: "/faq" } });
    service.verifyWebhookChallenge.mockReturnValue("challenge-ok");
  });

  it.each([
    ["config", listNotificationConfigHandler, service.listNotificationConfig, "get", "/v1/notifications/config", "/v1/notifications/config", undefined, 200],
    ["in-app list", listInAppNotificationsHandler, service.listInAppNotifications, "get", "/v1/in-app-notifications?unreadOnly=1", "/v1/in-app-notifications", undefined, 200],
    ["mark read", markInAppNotificationReadHandler, service.markInAppNotificationRead, "post", "/v1/in-app-notifications/n-1/read", "/v1/in-app-notifications/:notificationId/read", undefined, 200],
    ["resolve target", resolveInAppNotificationTargetHandler, targetResolver.resolveInAppNotificationTarget, "post", "/v1/in-app-notifications/n-1/resolve", "/v1/in-app-notifications/:notificationId/resolve", undefined, 200],
    ["mark all read", markAllInAppNotificationsReadHandler, service.markAllInAppNotificationsRead, "post", "/v1/in-app-notifications/read-all", "/v1/in-app-notifications/read-all", undefined, 200],
    ["create template", createNotificationTemplateHandler, service.createNotificationTemplate, "post", "/v1/notifications/templates", "/v1/notifications/templates", { key: "expiry" }, 201],
    ["update template", updateNotificationTemplateHandler, service.updateNotificationTemplate, "patch", "/v1/notifications/templates/t-1", "/v1/notifications/templates/:templateId", { key: "expiry" }, 200],
    ["create rule", createNotificationRuleHandler, service.createNotificationRule, "post", "/v1/notifications/rules", "/v1/notifications/rules", { channel: "EMAIL" }, 201],
    ["update rule", updateNotificationRuleHandler, service.updateNotificationRule, "patch", "/v1/notifications/rules/r-1", "/v1/notifications/rules/:ruleId", { channel: "EMAIL" }, 200],
    ["scan", scanNotificationJobsHandler, service.scanNotificationJobs, "post", "/v1/notifications/scan", "/v1/notifications/scan", { dryRun: true }, 200],
    ["process", processNotificationJobsHandler, service.processNotificationJobs, "post", "/v1/notifications/process", "/v1/notifications/process", {}, 200],
    ["manual", manualLicenseNotificationHandler, service.sendManualLicenseNotification, "post", "/v1/notifications/manual-license", "/v1/notifications/manual-license", { licenseId: "l-1" }, 200]
  ] as const)("returns a successful envelope for %s", async (_name, handler, mock, method, path, route, body, status) => {
    const response = await requestHandler({ handler, method, path, route, body });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true });
    expect(mock.mock.calls[0]?.[1]).toMatchObject({ id: "admin-1", organizationId: "org-1" });
  });

  it("verifies the Meta challenge as plain text", async () => {
    const response = await requestHandler({ handler: verifyMetaWebhookHandler, path: "/resource?hub.challenge=challenge" });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("challenge-ok");
  });

  it("handles the Meta webhook without contacting an external provider", async () => {
    const response = await requestHandler({
      handler: metaWebhookHandler,
      method: "post",
      body: { object: "whatsapp_business_account" },
      headers: { "x-hub-signature-256": "sha256=test" }
    });
    expect(await jsonEnvelope(response)).toMatchObject({ ok: true });
    expect(service.handleMetaWebhook).toHaveBeenCalledWith(expect.anything(), { object: "whatsapp_business_account" }, "sha256=test", expect.any(String));
  });

  it("rejects handler access without an authenticated tenant", async () => {
    const response = await requestHandler({ handler: listNotificationConfigHandler, user: null });
    expect(response.status).toBe(403);
    expect(service.listNotificationConfig).not.toHaveBeenCalled();
  });

  it.each([
    ["FORBIDDEN", 403],
    ["NOT_FOUND", 404],
    ["TEMPLATE_TAKEN", 409],
    ["WEBHOOK_INVALID", 403],
    ["PROVIDER_ERROR", 502],
    ["INVALID_INPUT", 400]
  ] as const)("maps %s domain failures to the standard envelope", async (code, status) => {
    service.createNotificationTemplate.mockRejectedValueOnce(new NotificationError(code));
    const response = await requestHandler({ handler: createNotificationTemplateHandler, method: "post", body: {} });
    expect(response.status).toBe(status);
    expect(await jsonEnvelope(response)).toMatchObject({ ok: false });
  });

  it("maps parser validation and unexpected service errors", async () => {
    service.parseNotificationTemplateInput.mockImplementationOnce(() => {
      throw new InputValidationError([{ field: "key", code: "INVALID_TYPE" }]);
    });
    const invalid = await requestHandler({ handler: createNotificationTemplateHandler, method: "post", body: {} });
    expect(invalid.status).toBe(400);
    expect(await jsonEnvelope(invalid)).toMatchObject({ error: { code: "INVALID_INPUT" } });

    service.listNotificationConfig.mockRejectedValueOnce(new Error("prisma failed"));
    const failed = await requestHandler({ handler: listNotificationConfigHandler });
    expect(failed.status).toBe(500);
    expect(await jsonEnvelope(failed)).toMatchObject({ error: { code: "INTERNAL_ERROR" } });
  });
});
