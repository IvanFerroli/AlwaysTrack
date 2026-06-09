import { describe, expect, it, vi } from "vitest";
import type { CurrentUser } from "@alwaystrack/shared";
import { enqueueRankingSnapshotJob, rankingSnapshotDedupeKey } from "./ranking-snapshot.jobs.js";

const actor: CurrentUser = {
  id: "admin-1",
  organizationId: "org-1",
  name: "Admin",
  email: "admin@example.com",
  role: "ADMIN",
  unitScopeIds: [],
  sectorScopeIds: []
};

describe("ranking snapshot jobs", () => {
  it("builds a deterministic dedupe key per organization and campaign", () => {
    expect(rankingSnapshotDedupeKey({ actor, campaignId: "campaign-1" })).toBe("ranking-snapshot.create:org-1:campaign-1");
  });

  it("runs inline by default and returns completed job metadata", async () => {
    const prisma = {
      salesCampaign: {
        findFirst: vi.fn().mockResolvedValue({
          id: "campaign-1",
          organizationId: "org-1",
          name: "Campanha",
          metric: "REVENUE",
          status: "ACTIVE",
          startsAt: new Date("2026-06-01"),
          endsAt: new Date("2026-06-30"),
          salesGroupId: null,
          salesGroup: null
        })
      },
      salesDocument: {
        findMany: vi.fn().mockResolvedValue([])
      },
      salesItem: {
        findMany: vi.fn().mockResolvedValue([])
      },
      rankingSnapshot: {
        create: vi.fn().mockResolvedValue({ id: "snapshot-1" })
      },
      auditLog: {
        create: vi.fn()
      }
    };

    const result = await enqueueRankingSnapshotJob(prisma as never, { actor, campaignId: "campaign-1" });

    expect(result).toEqual({
      job: {
        id: "ranking-snapshot.create:org-1:campaign-1",
        name: "ranking-snapshot.create",
        status: "completed",
        driver: "inline",
        dedupeKey: "ranking-snapshot.create:org-1:campaign-1"
      },
      result: {
        snapshot: { id: "snapshot-1" }
      }
    });
    expect(prisma.rankingSnapshot.create).toHaveBeenCalled();
  });
});
