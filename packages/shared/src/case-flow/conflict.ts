import type { EvidenceFact, NormalizedEvidenceKey } from "./evidence.js";

export const evidenceConflictStatuses = ["OPEN", "RESOLVED", "IGNORED"] as const;
export type EvidenceConflictStatus = (typeof evidenceConflictStatuses)[number];

export const evidenceConflictResolvers = ["RULE", "USER"] as const;
export type EvidenceConflictResolver = (typeof evidenceConflictResolvers)[number];

export interface EvidenceConflictResolution {
  chosenFactId?: string;
  reason: string;
  resolvedBy: EvidenceConflictResolver;
  resolvedAt?: string;
}

interface EvidenceConflictBase {
  id: string;
  caseId: string;
  key: NormalizedEvidenceKey;
  facts: EvidenceFact[];
  createdAt: string;
  updatedAt: string;
}

export type EvidenceConflict = EvidenceConflictBase & (
  | { status: "OPEN"; resolution?: never }
  | { status: "IGNORED"; resolution?: never }
  | { status: "RESOLVED"; resolution: EvidenceConflictResolution }
);
