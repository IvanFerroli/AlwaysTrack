import type { AgentRun, DecisionLog, JobPosting, SkillExecution } from "@olympus/shared-types";

interface Counters {
  jobPosting: number;
  agentRun: number;
  decisionLog: number;
  skillExecution: number;
}

function nextId(prefix: string, value: number): string {
  return `${prefix}-${value.toString().padStart(6, "0")}`;
}

export class InMemoryStateStore {
  private counters: Counters = {
    jobPosting: 1,
    agentRun: 1,
    decisionLog: 1,
    skillExecution: 1
  };

  private readonly jobPostings: JobPosting[] = [];
  private readonly agentRuns: AgentRun[] = [];
  private readonly decisionLogs: DecisionLog[] = [];
  private readonly skillExecutions: SkillExecution[] = [];

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

  findJobPostingById(id: string): JobPosting | undefined {
    return this.jobPostings.find((item) => item.id === id);
  }

  findJobPostingByDedupeKey(dedupeKey: string): JobPosting | undefined {
    return this.jobPostings.find((item) => item.dedupeKey === dedupeKey);
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
}
