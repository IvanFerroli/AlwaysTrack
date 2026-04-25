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

export interface StateStore {
  listJobPostings(): Promise<JobPosting[]>;
  listAgentRuns(): Promise<AgentRun[]>;
  listDecisionLogs(): Promise<DecisionLog[]>;
  listSkillExecutions(): Promise<SkillExecution[]>;
  listApprovalRequests(): Promise<ApprovalRequest[]>;
  listApplications(): Promise<ApplicationRecord[]>;
  listMemoryEntries(): Promise<MemoryEntry[]>;
  listResumeProfiles(): Promise<ResumeProfile[]>;

  findJobPostingById(id: string): Promise<JobPosting | undefined>;
  findJobPostingByDedupeKey(dedupeKey: string): Promise<JobPosting | undefined>;
  findApprovalRequestById(id: string): Promise<ApprovalRequest | undefined>;
  findPendingApprovalRequest(jobPostingId: string, resumeProfileId: string): Promise<ApprovalRequest | undefined>;
  findSubmittedApplication(jobPostingId: string, resumeProfileId: string): Promise<ApplicationRecord | undefined>;
  findApplicationById(id: string): Promise<ApplicationRecord | undefined>;
  findResumeProfileById(id: string): Promise<ResumeProfile | undefined>;

  insertJobPosting(payload: Omit<JobPosting, "id" | "createdAt">): Promise<JobPosting>;
  updateJobPosting(id: string, updates: Partial<Pick<JobPosting, "userStatus" | "tags">>): Promise<JobPosting | undefined>;

  createAgentRun(agent: string, capability: string): Promise<AgentRun>;
  completeAgentRun(agentRunId: string, status: "completed" | "failed"): Promise<void>;

  createDecisionLog(agentRunId: string, summary: string, rationale: string): Promise<DecisionLog>;
  createSkillExecution(agentRunId: string, skillName: string, status: "success" | "failure", evidence: string): Promise<SkillExecution>;

  createApprovalRequest(payload: Omit<ApprovalRequest, "id" | "createdAt" | "status">): Promise<ApprovalRequest>;
  approveRequest(id: string, approvedBy: string): Promise<ApprovalRequest | undefined>;
  rejectRequest(id: string, rejectedBy: string, reason: string): Promise<ApprovalRequest | undefined>;

  createApplication(payload: Omit<ApplicationRecord, "id" | "submittedAt" | "status">): Promise<ApplicationRecord>;
  updateApplicationStatus(id: string, status: "interview" | "rejected", updatedBy: string, reason: string): Promise<ApplicationRecord | undefined>;

  createMemoryEntry(payload: Omit<MemoryEntry, "id" | "createdAt">): Promise<MemoryEntry>;

  createResumeProfile(payload: Omit<ResumeProfile, "id" | "createdAt">): Promise<ResumeProfile>;
  updateResumeProfile(id: string, updates: Partial<Pick<ResumeProfile, "headline" | "skills">>): Promise<ResumeProfile | undefined>;

  recordIngestionAttempt(deduplicated: boolean): Promise<void>;
  recordStrategyProposal(): Promise<void>;
  snapshotMetrics(): Promise<MetricsSnapshot>;
}

interface Counters {
  jobPosting: number;
  agentRun: number;
  decisionLog: number;
  skillExecution: number;
  approvalRequest: number;
  application: number;
  memoryEntry: number;
  resumeProfile: number;
}

interface RuntimeCounters {
  ingestionAttempts: number;
  dedupeHits: number;
  strategyProposals: number;
}

function nextId(prefix: string, value: number): string {
  return `${prefix}-${value.toString().padStart(6, "0")}`;
}

export class InMemoryStateStore implements StateStore {
  private counters: Counters = {
    jobPosting: 1,
    agentRun: 1,
    decisionLog: 1,
    skillExecution: 1,
    approvalRequest: 1,
    application: 1,
    memoryEntry: 1,
    resumeProfile: 1
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
  private readonly resumeProfiles: ResumeProfile[] = [];

  constructor() {
    this.createResumeProfile({
      headline: "Software Engineer",
      skills: ["node", "typescript", "api"]
    });
  }

  async listJobPostings(): Promise<JobPosting[]> {
    return [...this.jobPostings];
  }

  async listAgentRuns(): Promise<AgentRun[]> {
    return [...this.agentRuns];
  }

  async listDecisionLogs(): Promise<DecisionLog[]> {
    return [...this.decisionLogs];
  }

  async listSkillExecutions(): Promise<SkillExecution[]> {
    return [...this.skillExecutions];
  }

  async listApprovalRequests(): Promise<ApprovalRequest[]> {
    return [...this.approvalRequests];
  }

  async listApplications(): Promise<ApplicationRecord[]> {
    return [...this.applications];
  }

  async listMemoryEntries(): Promise<MemoryEntry[]> {
    return [...this.memoryEntries];
  }

  async listResumeProfiles(): Promise<ResumeProfile[]> {
    return [...this.resumeProfiles];
  }

  async findJobPostingById(id: string): Promise<JobPosting | undefined> {
    return this.jobPostings.find((item) => item.id === id);
  }

  async findJobPostingByDedupeKey(dedupeKey: string): Promise<JobPosting | undefined> {
    return this.jobPostings.find((item) => item.dedupeKey === dedupeKey);
  }

  async findApprovalRequestById(id: string): Promise<ApprovalRequest | undefined> {
    return this.approvalRequests.find((item) => item.id === id);
  }

  async findPendingApprovalRequest(jobPostingId: string, resumeProfileId: string): Promise<ApprovalRequest | undefined> {
    return this.approvalRequests.find(
      (item) =>
        item.jobPostingId === jobPostingId &&
        item.resumeProfileId === resumeProfileId &&
        item.status === "pending"
    );
  }

  async findSubmittedApplication(jobPostingId: string, resumeProfileId: string): Promise<ApplicationRecord | undefined> {
    return this.applications.find(
      (item) =>
        item.jobPostingId === jobPostingId && item.resumeProfileId === resumeProfileId && item.status === "submitted"
    );
  }

  async findApplicationById(id: string): Promise<ApplicationRecord | undefined> {
    return this.applications.find((item) => item.id === id);
  }

  async findResumeProfileById(id: string): Promise<ResumeProfile | undefined> {
    return this.resumeProfiles.find((item) => item.id === id);
  }

  async insertJobPosting(payload: Omit<JobPosting, "id" | "createdAt">): Promise<JobPosting> {
    const jobPosting: JobPosting = {
      ...payload,
      id: nextId("job", this.counters.jobPosting++),
      createdAt: new Date().toISOString()
    };

    this.jobPostings.unshift(jobPosting);
    return jobPosting;
  }

  async updateJobPosting(id: string, updates: Partial<Pick<JobPosting, "userStatus" | "tags">>): Promise<JobPosting | undefined> {
    const job = await this.findJobPostingById(id);
    if (!job) return undefined;

    if (updates.userStatus) job.userStatus = updates.userStatus;
    if (updates.tags) job.tags = updates.tags;

    return job;
  }

  async createAgentRun(agent: string, capability: string): Promise<AgentRun> {
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

  async completeAgentRun(agentRunId: string, status: "completed" | "failed"): Promise<void> {
    const agentRun = this.agentRuns.find((item) => item.id === agentRunId);
    if (!agentRun) {
      return;
    }
    agentRun.status = status;
    agentRun.completedAt = new Date().toISOString();
  }

  async createDecisionLog(agentRunId: string, summary: string, rationale: string): Promise<DecisionLog> {
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

  async createSkillExecution(
    agentRunId: string,
    skillName: string,
    status: "success" | "failure",
    evidence: string
  ): Promise<SkillExecution> {
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

  async createApprovalRequest(
    payload: Omit<ApprovalRequest, "id" | "createdAt" | "status">
  ): Promise<ApprovalRequest> {
    const approval: ApprovalRequest = {
      ...payload,
      id: nextId("approval", this.counters.approvalRequest++),
      status: "pending",
      createdAt: new Date().toISOString()
    };

    this.approvalRequests.unshift(approval);
    return approval;
  }

  async approveRequest(id: string, approvedBy: string): Promise<ApprovalRequest | undefined> {
    const approval = await this.findApprovalRequestById(id);
    if (!approval || approval.status !== "pending") {
      return undefined;
    }
    approval.status = "approved";
    approval.approvedBy = approvedBy;
    approval.approvedAt = new Date().toISOString();
    return approval;
  }

  async rejectRequest(id: string, rejectedBy: string, reason: string): Promise<ApprovalRequest | undefined> {
    const approval = await this.findApprovalRequestById(id);
    if (!approval || approval.status !== "pending") {
      return undefined;
    }
    approval.status = "rejected";
    approval.rejectedBy = rejectedBy;
    approval.rejectedAt = new Date().toISOString();
    approval.rejectionReason = reason;
    return approval;
  }

  async createApplication(
    payload: Omit<ApplicationRecord, "id" | "submittedAt" | "status">
  ): Promise<ApplicationRecord> {
    const application: ApplicationRecord = {
      ...payload,
      id: nextId("application", this.counters.application++),
      status: "submitted",
      submittedAt: new Date().toISOString()
    };
    this.applications.unshift(application);
    return application;
  }

  async updateApplicationStatus(
    id: string,
    status: "interview" | "rejected",
    updatedBy: string,
    reason: string
  ): Promise<ApplicationRecord | undefined> {
    const application = await this.findApplicationById(id);
    if (!application) {
      return undefined;
    }
    application.status = status;
    application.outcomeBy = updatedBy;
    application.outcomeAt = new Date().toISOString();
    application.outcomeReason = reason;
    return application;
  }

  async createMemoryEntry(payload: Omit<MemoryEntry, "id" | "createdAt">): Promise<MemoryEntry> {
    const entry: MemoryEntry = {
      ...payload,
      id: nextId("memory", this.counters.memoryEntry++),
      createdAt: new Date().toISOString()
    };
    this.memoryEntries.unshift(entry);
    return entry;
  }

  async createResumeProfile(payload: Omit<ResumeProfile, "id" | "createdAt">): Promise<ResumeProfile> {
    const profile: ResumeProfile = {
      ...payload,
      id: nextId("resume", this.counters.resumeProfile++),
      createdAt: new Date().toISOString()
    };
    this.resumeProfiles.unshift(profile);
    return profile;
  }

  async updateResumeProfile(id: string, updates: Partial<Pick<ResumeProfile, "headline" | "skills">>): Promise<ResumeProfile | undefined> {
    const profile = await this.findResumeProfileById(id);
    if (!profile) return undefined;
    if (updates.headline) profile.headline = updates.headline;
    if (updates.skills) profile.skills = updates.skills;
    return profile;
  }

  async recordIngestionAttempt(deduplicated: boolean): Promise<void> {
    this.runtimeCounters.ingestionAttempts += 1;
    if (deduplicated) {
      this.runtimeCounters.dedupeHits += 1;
    }
  }

  async recordStrategyProposal(): Promise<void> {
    this.runtimeCounters.strategyProposals += 1;
  }

  async snapshotMetrics(): Promise<MetricsSnapshot> {
    const dedupeRate =
      this.runtimeCounters.ingestionAttempts > 0
        ? Number((this.runtimeCounters.dedupeHits / this.runtimeCounters.ingestionAttempts).toFixed(4))
        : 0;

    const pendingApprovals = this.approvalRequests.filter((item) => item.status === "pending").length;

    return {
      totalJobPostings: this.jobPostings.length,
      totalResumeProfiles: this.resumeProfiles.length,
      ingestionAttempts: this.runtimeCounters.ingestionAttempts,
      dedupeHits: this.runtimeCounters.dedupeHits,
      dedupeRate,
      strategyProposals: this.runtimeCounters.strategyProposals,
      pendingApprovals,
      submittedApplications: this.applications.length
    };
  }
}
