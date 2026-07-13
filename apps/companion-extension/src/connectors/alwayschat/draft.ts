export interface AuthorizedDraftDecision { allowed: true; capability: "INSERT_DRAFT"; authorizationRef: string }
export interface AlwaysChatDraftTarget { readonly mode: "DRAFT_ONLY"; insertDraft(text: string): Promise<void>; focusDraft?(): Promise<void> }
export interface AlwaysChatDraftAudit { type: "ALWAYSCHAT_DRAFT_INSERTED"; payload: { actionId: string; authorizationRef: string; characterCount: number } }

export async function insertAuthorizedAlwaysChatDraft(input: {
  enabled?: boolean;
  explicitClick: boolean;
  actionId: string;
  text: string;
  decision: AuthorizedDraftDecision | { allowed: false };
  target: AlwaysChatDraftTarget;
}): Promise<AlwaysChatDraftAudit> {
  if (input.enabled !== true) throw new Error("RUNTIME_DISABLED");
  if (!input.explicitClick) throw new Error("EXPLICIT_CLICK_REQUIRED");
  if (!input.decision.allowed || input.decision.capability !== "INSERT_DRAFT" || !input.decision.authorizationRef.trim()) throw new Error("AUTHORIZATION_REQUIRED");
  const text = input.text.trim();
  if (!text) throw new TypeError("Draft text is required");
  await input.target.focusDraft?.();
  await input.target.insertDraft(text);
  return { type: "ALWAYSCHAT_DRAFT_INSERTED", payload: { actionId: input.actionId, authorizationRef: input.decision.authorizationRef, characterCount: text.length } };
}
