import { PrismaClient } from "@prisma/client";
import type {
  AgentRun,
  ApplicationRecord,
  ApprovalRequest,
  DecisionLog,
  JobPosting,
  MemoryEntry,
  MetricsSnapshot,
  ResumeProfile,
  SkillExecution
} from "@olympus/shared-types";
import type { StateStore } from "./store.js";

function nextId(prefix: string, value: number): string {
  return `${prefix}-${value.toString().padStart(6, "0")}`;
}

export class PrismaStateStore implements StateStore {
  private static readonly METRIC_KEYS = {
    ingestionAttempts: "ingestionAttempts",
    dedupeHits: "dedupeHits",
    strategyProposals: "strategyProposals"
  } as const;

  constructor(private readonly prisma: PrismaClient) {}

  private metricIncrementQuery(key: string, amount = 1) {
    return this.prisma.runtimeMetric.upsert({
      where: { key },
      create: { key, value: amount },
      update: { value: { increment: amount } }
    });
  }

  private async incrementMetric(key: string, amount = 1): Promise<void> {
    await this.metricIncrementQuery(key, amount);
  }

  private async loadRuntimeMetrics(): Promise<{
    ingestionAttempts: number;
    dedupeHits: number;
    strategyProposals: number;
  }> {
    const rows = await this.prisma.runtimeMetric.findMany({
      where: {
        key: {
          in: [
            PrismaStateStore.METRIC_KEYS.ingestionAttempts,
            PrismaStateStore.METRIC_KEYS.dedupeHits,
            PrismaStateStore.METRIC_KEYS.strategyProposals
          ]
        }
      }
    });

    const byKey = new Map(rows.map((row) => [row.key, row.value]));
    return {
      ingestionAttempts: byKey.get(PrismaStateStore.METRIC_KEYS.ingestionAttempts) ?? 0,
      dedupeHits: byKey.get(PrismaStateStore.METRIC_KEYS.dedupeHits) ?? 0,
      strategyProposals: byKey.get(PrismaStateStore.METRIC_KEYS.strategyProposals) ?? 0
    };
  }

  async listJobPostings(): Promise<JobPosting[]> {
    const records = await this.prisma.jobPosting.findMany({ orderBy: { createdAt: "desc" } });
    return records.map((r) => ({
      ...r,
      userStatus: r.userStatus as "new" | "applied" | "discarded",
      createdAt: r.createdAt.toISOString(),
      postedAt: r.postedAt ?? undefined,
      location: r.location ?? undefined
    }));
  }

  async listAgentRuns(): Promise<AgentRun[]> {
    const records = await this.prisma.agentRun.findMany({ orderBy: { startedAt: "desc" } });
    return records.map((r) => ({
      ...r,
      status: r.status as "started" | "completed" | "failed",
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString()
    }));
  }

  async listDecisionLogs(): Promise<DecisionLog[]> {
    const records = await this.prisma.decisionLog.findMany({ orderBy: { createdAt: "desc" } });
    return records.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString()
    }));
  }

  async listSkillExecutions(): Promise<SkillExecution[]> {
    const records = await this.prisma.skillExecution.findMany({ orderBy: { startedAt: "desc" } });
    return records.map((r) => ({
      ...r,
      status: r.status as "success" | "failure",
      startedAt: r.startedAt.toISOString(),
      finishedAt: (r.finishedAt ?? r.startedAt).toISOString()
    }));
  }

  async listApprovalRequests(): Promise<ApprovalRequest[]> {
    const records = await this.prisma.approvalRequest.findMany({ orderBy: { createdAt: "desc" } });
    return records.map((r) => ({
      ...r,
      actionType: r.actionType as "SEND_APPLICATION",
      status: r.status as "pending" | "approved" | "rejected",
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString(),
      rejectedAt: r.rejectedAt?.toISOString(),
      approvedBy: r.approvedBy ?? undefined,
      rejectedBy: r.rejectedBy ?? undefined,
      rejectionReason: r.rejectionReason ?? undefined
    }));
  }

  async listApplications(): Promise<ApplicationRecord[]> {
    const records = await this.prisma.applicationRecord.findMany({ orderBy: { submittedAt: "desc" } });
    return records.map((r) => ({
      ...r,
      status: r.status as "submitted" | "interview" | "rejected",
      submittedAt: r.submittedAt.toISOString(),
      outcomeAt: r.outcomeAt?.toISOString(),
      outcomeBy: r.outcomeBy ?? undefined,
      outcomeReason: r.outcomeReason ?? undefined
    }));
  }

  async listMemoryEntries(): Promise<MemoryEntry[]> {
    const records = await this.prisma.memoryEntry.findMany({ orderBy: { createdAt: "desc" } });
    return records.map((r) => ({
      ...r,
      type: r.type as "APPLICATION_RESULT" | "STRATEGY_HINT" | "APPROVAL_RESULT",
      createdAt: r.createdAt.toISOString()
    }));
  }

  async listResumeProfiles(): Promise<ResumeProfile[]> {
    const records = await this.prisma.resumeProfile.findMany({ orderBy: { createdAt: "desc" } });
    return records.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString()
    }));
  }

  async findJobPostingById(id: string): Promise<JobPosting | undefined> {
    const r = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!r) return undefined;
    return {
      ...r,
      userStatus: r.userStatus as "new" | "applied" | "discarded",
      createdAt: r.createdAt.toISOString(),
      postedAt: r.postedAt ?? undefined,
      location: r.location ?? undefined
    };
  }

  async findJobPostingByDedupeKey(dedupeKey: string): Promise<JobPosting | undefined> {
    const r = await this.prisma.jobPosting.findUnique({ where: { dedupeKey } });
    if (!r) return undefined;
    return {
      ...r,
      userStatus: r.userStatus as "new" | "applied" | "discarded",
      createdAt: r.createdAt.toISOString(),
      postedAt: r.postedAt ?? undefined,
      location: r.location ?? undefined
    };
  }

  async findApprovalRequestById(id: string): Promise<ApprovalRequest | undefined> {
    const r = await this.prisma.approvalRequest.findUnique({ where: { id } });
    if (!r) return undefined;
    return {
      ...r,
      actionType: r.actionType as "SEND_APPLICATION",
      status: r.status as "pending" | "approved" | "rejected",
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString(),
      rejectedAt: r.rejectedAt?.toISOString(),
      approvedBy: r.approvedBy ?? undefined,
      rejectedBy: r.rejectedBy ?? undefined,
      rejectionReason: r.rejectionReason ?? undefined
    };
  }

  async findPendingApprovalRequest(jobPostingId: string, resumeProfileId: string): Promise<ApprovalRequest | undefined> {
    const r = await this.prisma.approvalRequest.findFirst({
      where: { jobPostingId, resumeProfileId, status: "pending" }
    });
    if (!r) return undefined;
    return {
      ...r,
      actionType: r.actionType as "SEND_APPLICATION",
      status: r.status as "pending" | "approved" | "rejected",
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString(),
      rejectedAt: r.rejectedAt?.toISOString(),
      approvedBy: r.approvedBy ?? undefined,
      rejectedBy: r.rejectedBy ?? undefined,
      rejectionReason: r.rejectionReason ?? undefined
    };
  }

  async findSubmittedApplication(jobPostingId: string, resumeProfileId: string): Promise<ApplicationRecord | undefined> {
    const r = await this.prisma.applicationRecord.findFirst({
      where: { jobPostingId, resumeProfileId, status: "submitted" }
    });
    if (!r) return undefined;
    return {
      ...r,
      status: r.status as "submitted" | "interview" | "rejected",
      submittedAt: r.submittedAt.toISOString(),
      outcomeAt: r.outcomeAt?.toISOString(),
      outcomeBy: r.outcomeBy ?? undefined,
      outcomeReason: r.outcomeReason ?? undefined
    };
  }

  async findApplicationById(id: string): Promise<ApplicationRecord | undefined> {
    const r = await this.prisma.applicationRecord.findUnique({ where: { id } });
    if (!r) return undefined;
    return {
      ...r,
      status: r.status as "submitted" | "interview" | "rejected",
      submittedAt: r.submittedAt.toISOString(),
      outcomeAt: r.outcomeAt?.toISOString(),
      outcomeBy: r.outcomeBy ?? undefined,
      outcomeReason: r.outcomeReason ?? undefined
    };
  }

  async findResumeProfileById(id: string): Promise<ResumeProfile | undefined> {
    const r = await this.prisma.resumeProfile.findUnique({ where: { id } });
    if (!r) return undefined;
    return {
      ...r,
      createdAt: r.createdAt.toISOString()
    };
  }

  async insertJobPosting(payload: Omit<JobPosting, "id" | "createdAt">): Promise<JobPosting> {
    const count = await this.prisma.jobPosting.count();
    const id = nextId("job", count + 1);
    const r = await this.prisma.jobPosting.create({
      data: {
        ...payload,
        id,
        location: payload.location ?? null,
        postedAt: payload.postedAt ?? null
      }
    });
    return {
      ...r,
      userStatus: r.userStatus as "new" | "applied" | "discarded",
      createdAt: r.createdAt.toISOString(),
      postedAt: r.postedAt ?? undefined,
      location: r.location ?? undefined
    };
  }

  async updateJobPosting(id: string, updates: Partial<Pick<JobPosting, "userStatus" | "tags">>): Promise<JobPosting | undefined> {
    try {
      const r = await this.prisma.jobPosting.update({
        where: { id },
        data: updates
      });
      return {
        ...r,
        userStatus: r.userStatus as "new" | "applied" | "discarded",
        createdAt: r.createdAt.toISOString(),
        postedAt: r.postedAt ?? undefined,
        location: r.location ?? undefined
      };
    } catch {
      return undefined;
    }
  }

  async createAgentRun(agent: string, capability: string): Promise<AgentRun> {
    const count = await this.prisma.agentRun.count();
    const id = nextId("run", count + 1);
    const r = await this.prisma.agentRun.create({
      data: {
        id,
        agent,
        capability,
        status: "started"
      }
    });
    return {
      ...r,
      status: r.status as "started" | "completed" | "failed",
      startedAt: r.startedAt.toISOString(),
      completedAt: r.completedAt?.toISOString()
    };
  }

  async completeAgentRun(agentRunId: string, status: "completed" | "failed"): Promise<void> {
    await this.prisma.agentRun.update({
      where: { id: agentRunId },
      data: { status, completedAt: new Date() }
    }).catch(() => {});
  }

  async createDecisionLog(agentRunId: string, summary: string, rationale: string): Promise<DecisionLog> {
    const count = await this.prisma.decisionLog.count();
    const id = nextId("decision", count + 1);
    const r = await this.prisma.decisionLog.create({
      data: { id, agentRunId, summary, rationale }
    });
    return {
      ...r,
      createdAt: r.createdAt.toISOString()
    };
  }

  async createSkillExecution(
    agentRunId: string,
    skillName: string,
    status: "success" | "failure",
    evidence: string
  ): Promise<SkillExecution> {
    const count = await this.prisma.skillExecution.count();
    const id = nextId("skill", count + 1);
    const r = await this.prisma.skillExecution.create({
      data: { id, agentRunId, skillName, status, evidence, finishedAt: new Date() }
    });
    return {
      ...r,
      status: r.status as "success" | "failure",
      startedAt: r.startedAt.toISOString(),
      finishedAt: (r.finishedAt ?? r.startedAt).toISOString()
    };
  }

  async createApprovalRequest(payload: Omit<ApprovalRequest, "id" | "createdAt" | "status">): Promise<ApprovalRequest> {
    const count = await this.prisma.approvalRequest.count();
    const id = nextId("approval", count + 1);
    const r = await this.prisma.approvalRequest.create({
      data: { ...payload, id, status: "pending" }
    });
    return {
      ...r,
      actionType: r.actionType as "SEND_APPLICATION",
      status: r.status as "pending" | "approved" | "rejected",
      createdAt: r.createdAt.toISOString(),
      approvedAt: r.approvedAt?.toISOString(),
      rejectedAt: r.rejectedAt?.toISOString(),
      approvedBy: r.approvedBy ?? undefined,
      rejectedBy: r.rejectedBy ?? undefined,
      rejectionReason: r.rejectionReason ?? undefined
    };
  }

  async approveRequest(id: string, approvedBy: string): Promise<ApprovalRequest | undefined> {
    try {
      const r = await this.prisma.approvalRequest.update({
        where: { id, status: "pending" },
        data: { status: "approved", approvedBy, approvedAt: new Date() }
      });
      return {
        ...r,
        actionType: r.actionType as "SEND_APPLICATION",
        status: r.status as "pending" | "approved" | "rejected",
        createdAt: r.createdAt.toISOString(),
        approvedAt: r.approvedAt?.toISOString(),
        rejectedAt: r.rejectedAt?.toISOString(),
        approvedBy: r.approvedBy ?? undefined,
        rejectedBy: r.rejectedBy ?? undefined,
        rejectionReason: r.rejectionReason ?? undefined
      };
    } catch {
      return undefined;
    }
  }

  async rejectRequest(id: string, rejectedBy: string, reason: string): Promise<ApprovalRequest | undefined> {
    try {
      const r = await this.prisma.approvalRequest.update({
        where: { id, status: "pending" },
        data: { status: "rejected", rejectedBy, rejectionReason: reason, rejectedAt: new Date() }
      });
      return {
        ...r,
        actionType: r.actionType as "SEND_APPLICATION",
        status: r.status as "pending" | "approved" | "rejected",
        createdAt: r.createdAt.toISOString(),
        approvedAt: r.approvedAt?.toISOString(),
        rejectedAt: r.rejectedAt?.toISOString(),
        approvedBy: r.approvedBy ?? undefined,
        rejectedBy: r.rejectedBy ?? undefined,
        rejectionReason: r.rejectionReason ?? undefined
      };
    } catch {
      return undefined;
    }
  }

  async createApplication(payload: Omit<ApplicationRecord, "id" | "submittedAt" | "status">): Promise<ApplicationRecord> {
    const count = await this.prisma.applicationRecord.count();
    const id = nextId("application", count + 1);
    const r = await this.prisma.applicationRecord.create({
      data: { ...payload, id, status: "submitted" }
    });
    return {
      ...r,
      status: r.status as "submitted" | "interview" | "rejected",
      submittedAt: r.submittedAt.toISOString(),
      outcomeAt: r.outcomeAt?.toISOString(),
      outcomeBy: r.outcomeBy ?? undefined,
      outcomeReason: r.outcomeReason ?? undefined
    };
  }

  async updateApplicationStatus(
    id: string,
    status: "interview" | "rejected",
    updatedBy: string,
    reason: string
  ): Promise<ApplicationRecord | undefined> {
    try {
      const r = await this.prisma.applicationRecord.update({
        where: { id },
        data: { status, outcomeBy: updatedBy, outcomeReason: reason, outcomeAt: new Date() }
      });
      return {
        ...r,
        status: r.status as "submitted" | "interview" | "rejected",
        submittedAt: r.submittedAt.toISOString(),
        outcomeAt: r.outcomeAt?.toISOString(),
        outcomeBy: r.outcomeBy ?? undefined,
        outcomeReason: r.outcomeReason ?? undefined
      };
    } catch {
      return undefined;
    }
  }

  async createMemoryEntry(payload: Omit<MemoryEntry, "id" | "createdAt">): Promise<MemoryEntry> {
    const count = await this.prisma.memoryEntry.count();
    const id = nextId("memory", count + 1);
    const r = await this.prisma.memoryEntry.create({
      data: { ...payload, id }
    });
    return {
      ...r,
      type: r.type as "APPLICATION_RESULT" | "STRATEGY_HINT" | "APPROVAL_RESULT",
      createdAt: r.createdAt.toISOString()
    };
  }

  async createResumeProfile(payload: Omit<ResumeProfile, "id" | "createdAt">): Promise<ResumeProfile> {
    const count = await this.prisma.resumeProfile.count();
    const id = nextId("resume", count + 1);
    const r = await this.prisma.resumeProfile.create({
      data: { ...payload, id }
    });
    return {
      ...r,
      createdAt: r.createdAt.toISOString()
    };
  }

  async updateResumeProfile(id: string, updates: Partial<Pick<ResumeProfile, "headline" | "skills">>): Promise<ResumeProfile | undefined> {
    try {
      const r = await this.prisma.resumeProfile.update({
        where: { id },
        data: updates
      });
      return {
        ...r,
        createdAt: r.createdAt.toISOString()
      };
    } catch {
      return undefined;
    }
  }

  async recordIngestionAttempt(deduplicated: boolean): Promise<void> {
    if (!deduplicated) {
      await this.incrementMetric(PrismaStateStore.METRIC_KEYS.ingestionAttempts, 1);
      return;
    }

    await this.prisma.$transaction([
      this.metricIncrementQuery(PrismaStateStore.METRIC_KEYS.ingestionAttempts, 1),
      this.metricIncrementQuery(PrismaStateStore.METRIC_KEYS.dedupeHits, 1)
    ]);
  }

  async recordStrategyProposal(): Promise<void> {
    await this.incrementMetric(PrismaStateStore.METRIC_KEYS.strategyProposals, 1);
  }

  async snapshotMetrics(): Promise<MetricsSnapshot> {
    const runtimeCounters = await this.loadRuntimeMetrics();
    const dedupeRate =
      runtimeCounters.ingestionAttempts > 0
        ? Number((runtimeCounters.dedupeHits / runtimeCounters.ingestionAttempts).toFixed(4))
        : 0;

    const [totalJobPostings, totalResumeProfiles, pendingApprovals, submittedApplications] = await Promise.all([
      this.prisma.jobPosting.count(),
      this.prisma.resumeProfile.count(),
      this.prisma.approvalRequest.count({ where: { status: "pending" } }),
      this.prisma.applicationRecord.count()
    ]);

    return {
      totalJobPostings,
      totalResumeProfiles,
      ingestionAttempts: runtimeCounters.ingestionAttempts,
      dedupeHits: runtimeCounters.dedupeHits,
      dedupeRate,
      strategyProposals: runtimeCounters.strategyProposals,
      pendingApprovals,
      submittedApplications
    };
  }
}
