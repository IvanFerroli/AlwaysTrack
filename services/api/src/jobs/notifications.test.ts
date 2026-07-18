import { beforeEach, describe, expect, it, vi } from "vitest";

const { processNotificationJobsMock, scanNotificationJobsMock } = vi.hoisted(() => ({
  processNotificationJobsMock: vi.fn(),
  scanNotificationJobsMock: vi.fn()
}));

vi.mock("../core/db/prisma.js", () => ({ prisma: {} }));
vi.mock("../core/notifications/provider.js", () => ({ getNotificationProvider: vi.fn() }));
vi.mock("../core/notifications/notifications.service.js", () => ({
  processNotificationJobs: processNotificationJobsMock,
  scanNotificationJobs: scanNotificationJobsMock
}));

import { runNotificationWorker } from "./notifications.js";

function adminFixture(id: string, organizationId: string, createdAt: string) {
  return {
    id,
    organizationId,
    name: id,
    email: `${id}@example.com`,
    role: "ADMIN",
    active: true,
    unitScopeJson: null,
    sectorScopeJson: null,
    createdAt: new Date(createdAt)
  };
}

describe("notification worker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scanNotificationJobsMock.mockResolvedValue({ created: [{ id: "job" }], skipped: [] });
    processNotificationJobsMock.mockResolvedValue({ processed: [{ id: "job" }] });
  });

  it("processes every eligible organization with its oldest active admin", async () => {
    const database = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          adminFixture("admin-org-1", "org-1", "2026-01-01T00:00:00.000Z"),
          adminFixture("second-admin-org-1", "org-1", "2026-02-01T00:00:00.000Z"),
          adminFixture("admin-org-2", "org-2", "2026-01-15T00:00:00.000Z")
        ])
      }
    };
    const provider = { sendWhatsAppTemplate: vi.fn() };

    const result = await runNotificationWorker(database as never, provider, 20);

    expect(database.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "ADMIN", active: true, organization: { active: true } } })
    );
    expect(scanNotificationJobsMock.mock.calls.map((call) => call[1])).toEqual([
      expect.objectContaining({ id: "admin-org-1", organizationId: "org-1" }),
      expect.objectContaining({ id: "admin-org-2", organizationId: "org-2" })
    ]);
    expect(processNotificationJobsMock.mock.calls.map((call) => call[1].organizationId)).toEqual(["org-1", "org-2"]);
    expect(processNotificationJobsMock).toHaveBeenCalledWith(database, expect.any(Object), provider, 20);
    expect(result).toMatchObject({ scanned: 2, processed: 2, failures: [] });
    expect(result.organizations).toHaveLength(2);
  });

  it("continues with later organizations when one tenant fails", async () => {
    const database = {
      user: {
        findMany: vi.fn().mockResolvedValue([
          adminFixture("admin-org-1", "org-1", "2026-01-01T00:00:00.000Z"),
          adminFixture("admin-org-2", "org-2", "2026-01-02T00:00:00.000Z")
        ])
      }
    };
    scanNotificationJobsMock.mockRejectedValueOnce(new Error("org-1 failed"));

    const result = await runNotificationWorker(database as never, { sendWhatsAppTemplate: vi.fn() }, 10);

    expect(scanNotificationJobsMock).toHaveBeenCalledTimes(2);
    expect(processNotificationJobsMock).toHaveBeenCalledTimes(1);
    expect(result.failures).toEqual([expect.objectContaining({ organizationId: "org-1", error: "org-1 failed" })]);
    expect(result.organizations).toContainEqual(expect.objectContaining({ organizationId: "org-2", processed: 1 }));
  });
});
