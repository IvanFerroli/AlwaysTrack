import type {
  AgentRun,
  ApplicationRecord,
  ApprovalRequest,
  DecisionLog,
  JobPosting,
  MemoryEntry,
  MetricsSnapshot,
  SkillExecution
} from "@olympus/shared-types";

interface Counters {
  jobPosting: number;
  agentRun: number;
  decisionLog: number;
  skillExecution: number;
  approvalRequest: number;
  application: number;
  memoryEntry: number;
}

interface RuntimeCounters {
  ingestionAttempts: number;
  dedupeHits: number;
  strategyProposals: number;
}

function nextId(prefix: string, value: number): string {
  return `${prefix}-${value.toString().padStart(6, "0")}`;
}

export class InMemoryStateStore {
  private counters: Counters = {
    jobPosting: 1,
    agentRun: 1,
    decisionLog: 1,
    skillExecution: 1,
    approvalRequest: 1,
    application: 1,
    memoryEntry: 1
  };

  private runtimeCounters: RuntimeCounters = {
    ingestionAttempts: 0,
    dedupeHits: 0,
    strategyProposals: 0
  };

  private readonly jobPostings: JobPosting[] = [];
  private readonly agentRuns: AgentRun[] = [];
  private readonly decisionLogs: DecisionLog[] = [];
  private readonly skillExecutions: SkillExecution[] = [];
  private readonly approvalRequests: ApprovalRequest[] = [];
  private readonly applications: ApplicationRecord[] = [];
  private readonly memoryEntries: MemoryEntry[] = [];

  listJobPostings(): JobPosting[] {
    return [...this.jobPostings];
  }

  listAgentRuns(): AgentRun[] {
    return [...this.agentRuns];
  }

  listDecisionLogs(): DecisionLog[] {
    return [...this.decisionLogs];
  }

  listSkillExecutions(): SkillExecution[] {
    return [...this.skillExecutions];
  }

  listApprovalRequests(): ApprovalRequest[] {
    return [...this.approvalRequests];
  }

  listApplications(): ApplicationRecord[] {
    return [...this.applications];
  }

  listMemoryEntries(): MemoryEntry[] {
    return [...this.memoryEntries];
  }

  findJobPostingById(id: string): JobPosting | undefined {
    return this.jobPostings.find((item) => item.id === id);
  }

  findJobPostingByDedupeKey(dedupeKey: string): JobPosting | undefined {
    return this.jobPostings.find((item) => item.dedupeKey === dedupeKey);
  }

  findApprovalRequestById(id: string): ApprovalRequest | undefined {
    return this.approvalRequests.find((item) => item.id === id);
  }

  insertJobPosting(payload: Omit<JobPosting, "id" | "createdAt">): JobPosting {
    const jobPosting: JobPosting = {
      ...payload,
      id: nextId("job", this.counters.jobPosting++),
      createdAt: new Date().toISOString()
    };

    this.jobPostings.unshift(jobPosting);
    return jobPosting;
  }

  createAgentRun(agent: string, capability: string): AgentRun {
    const agentRun: AgentRun = {
      id: nextId("run", this.counters.agentRun++),
      agent,
      capability,
      status: "started",
      startedAt: new Date().toISOString()
    };

    this.agentRuns.unshift(agentRun);
    return agentRun;
  }

  completeAgentRun(agentRunId: string, status: "completed" | "failed"): void {
    const agentRun = this.agentRuns.find((item) => item.id === agentRunId);
    if (!agentRun) {
      return;
    }
    agentRun.status = status;
    agentRun.completedAt = new Date().toISOString();
  }

  createDecisionLog(agentRunId: string, summary: string, rationale: string): DecisionLog {
    const decision: DecisionLog = {
      id: nextId("decision", this.counters.decisionLog++),
      agentRunId,
      summary,
      rationale,
      createdAt: new Date().toISOString()
    };

    this.decisionLogs.unshift(decision);
    return decision;
  }

  createSkillExecution(
    agentRunId: string,
    skillName: string,
    status: "success" | "failure",
    evidence: string
  ): SkillExecution {
    const now = new Date().toISOString();
    const execution: SkillExecution = {
      id: nextId("skill", this.counters.skillExecution++),
      agentRunId,
      skillName,
      status,
      startedAt: now,
      finishedAt: now,
      evidence
    };

    this.skillExecutions.unshift(execution);
    return execution;
  }

  createApprovalRequest(
    payload: Omit<ApprovalRequest, "id" | "createdAt" | "status">
  ): ApprovalRequest {
    const approval: ApprovalRequest = {
      ...payload,
      id: nextId("approval", this.counters.approvalRequest++),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    this.approvalRequests.unshift(approval);
    return approval;
  }

  approveRequest(id: string, approvedBy: string): ApprovalRequest | undefined {
    const approval = this.findApprovalRequestById(id);
    if (!approval || approval.status !== "pending") {
      return undefined;
    }
    approval.status = "approved";
    approval.approvedBy = approvedBy;
    approval.approvedAt = new Date().toISOString();
    return approval;
  }

  createApplication(
    payload: Omit<ApplicationRecord, "id" | "submittedAt" | "status">
  ): ApplicationRecord {
    const application: ApplicationRecord = {
      ...payload,
      id: nextId("application", this.counters.application++),
      status: "submitted",
      submittedAt: new Date().toISOString()
    };
    this.applications.unshift(application);
    return application;
  }

  createMemoryEntry(payload: Omit<MemoryEntry, "id" | "createdAt">): MemoryEntry {
    const entry: MemoryEntry = {
      ...payload,
      id: nextId("memory", this.counters.memoryEntry++),
      createdAt: new Date().toISOString()
    };
    this.memoryEntries.unshift(entry);
    return entry;
  }

  recordIngestionAttempt(deduplicated: boolean): void {
    this.runtimeCounters.ingestionAttempts += 1;
    if (deduplicated) {
      this.runtimeCounters.dedupeHits += 1;
    }
  }

  recordStrategyProposal(): void {
    this.runtimeCounters.strategyProposals += 1;
  }

  snapshotMetrics(): MetricsSnapshot {
    const dedupeRate =
      this.runtimeCounters.ingestionAttempts > 0
        ? Number((this.runtimeCounters.dedupeHits / this.runtimeCounters.ingestionAttempts).toFixed(4))
        : 0;

    const pendingApprovals = this.approvalRequests.filter((item) => item.status === "pending").length;

    return {
      totalJobPostings: this.jobPostings.length,
      ingestionAttempts: this.runtimeCounters.ingestionAttempts,
      dedupeHits: this.runtimeCounters.dedupeHits,
      dedupeRate,
      strategyProposals: this.runtimeCounters.strategyProposals,
      pendingApprovals,
      submittedApplications: this.applications.length
    };
  }
}
