export const caseFlowMessageChannels = ["CUSTOMER", "EMAIL", "WHISPER", "SLACK", "CHECKLIST", "INTERNAL_NOTE", "MANUAL_REQUEST", "TICKET"] as const;
export type CaseFlowMessageChannel = (typeof caseFlowMessageChannels)[number];

export const placeholderKinds = ["REQUIRED", "OPTIONAL", "DERIVED", "FORMATTED", "SENSITIVE"] as const;
export type PlaceholderKind = (typeof placeholderKinds)[number];

export interface MessagePlaceholderDefinition {
  key: string;
  kind: PlaceholderKind;
  essential?: boolean;
  fallback?: string;
}

export interface CaseFlowMessageSource {
  scriptId: string;
  revisionId: string;
  revision: number;
}

export interface CompiledCaseFlowMessage {
  id: string;
  caseId: string;
  planRevision: number;
  nodeId: string;
  channel: CaseFlowMessageChannel;
  text: string;
  source: CaseFlowMessageSource;
  pendingPlaceholders: string[];
  copyAllowed: boolean;
}

export interface CaseFlowMessageCopyReceipt {
  messageId: string;
  caseId: string;
  userId: string;
  planRevision: number;
  copiedAt: string;
  externalWrite: false;
}
