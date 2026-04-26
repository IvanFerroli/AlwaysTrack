import type { JobSeniority, JobPosting } from "@olympus/shared-types";

export const JOB_SENIORITY_LEVELS = ["junior", "mid", "senior", "lead"] as const;

const JUNIOR_PATTERNS = [
  /\bjunior\b/gi,
  /\bjr\b/gi,
  /\bestagio\b/gi,
  /\bestagiario\b/gi,
  /\bintern(ship)?\b/gi,
  /\btrainee\b/gi
];

const MID_PATTERNS = [
  /\bpleno\b/gi,
  /\bmid\b/gi,
  /\bmiddle\b/gi,
  /\bmid[\s-]?level\b/gi,
  /\bintermedi(a|á)rio\b/gi
];

const SENIOR_PATTERNS = [
  /\bsenior\b/gi,
  /\bsr\b/gi,
  /\bseniority\b/gi,
  /\bspecialist\b/gi,
  /\bespecialista\b/gi
];

const LEAD_PATTERNS = [
  /\blead\b/gi,
  /\btech[\s-]?lead\b/gi,
  /\bprincipal\b/gi,
  /\bstaff\b/gi,
  /\barchitect\b/gi,
  /\barquiteto\b/gi,
  /\bcoordenador\b/gi,
  /\bmanager\b/gi
];

function normalizeForMatch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function countPatternHits(value: string, patterns: RegExp[]): number {
  let count = 0;
  for (const pattern of patterns) {
    const matches = value.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }
  return count;
}

function senioritySignal(job: Pick<JobPosting, "title" | "description" | "normalizedTokens" | "tags">): Record<JobSeniority, number> {
  const title = normalizeForMatch(job.title);
  const description = normalizeForMatch(job.description);
  const tags = normalizeForMatch(job.tags.join(" "));
  const tokens = normalizeForMatch(job.normalizedTokens.join(" "));
  const context = `${description} ${tags} ${tokens}`;

  const junior = countPatternHits(title, JUNIOR_PATTERNS) * 3 + countPatternHits(context, JUNIOR_PATTERNS);
  const mid = countPatternHits(title, MID_PATTERNS) * 3 + countPatternHits(context, MID_PATTERNS);
  const senior = countPatternHits(title, SENIOR_PATTERNS) * 3 + countPatternHits(context, SENIOR_PATTERNS);
  const lead = countPatternHits(title, LEAD_PATTERNS) * 4 + countPatternHits(context, LEAD_PATTERNS);

  return { junior, mid, senior, lead };
}

export function inferJobSeniority(
  job: Pick<JobPosting, "title" | "description" | "normalizedTokens" | "tags">
): JobSeniority {
  const signals = senioritySignal(job);
  const explicitMax = Math.max(signals.junior, signals.mid, signals.senior, signals.lead);
  if (explicitMax <= 0) {
    return "mid";
  }

  if (signals.lead === explicitMax) return "lead";
  if (signals.senior === explicitMax) return "senior";
  if (signals.junior === explicitMax) return "junior";
  return "mid";
}

export function toSeniorityTag(level: JobSeniority): string {
  return `seniority:${level}`;
}

export function withSeniorityTag(tags: string[], level: JobSeniority): string[] {
  const seniorityTag = toSeniorityTag(level);
  const lower = new Set(tags.map((tag) => tag.toLowerCase()));
  if (lower.has(seniorityTag)) {
    return [...tags];
  }
  return [...tags, seniorityTag];
}
