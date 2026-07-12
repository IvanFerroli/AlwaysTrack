export type CopyActionKind = "MESSAGE" | "WHISPER" | "SLACK_DRAFT" | "CHECKLIST";

export interface CopyAction {
  id: string;
  kind: CopyActionKind;
  label: string;
  content: string;
  obsolete?: boolean;
}

export interface CopyActionIntent {
  type: "CASE_FLOW_CONTENT_COPIED";
  payload: { actionId: string; kind: CopyActionKind };
}

export function createCopyIntent(action: CopyAction): CopyActionIntent {
  return { type: "CASE_FLOW_CONTENT_COPIED", payload: { actionId: action.id, kind: action.kind } };
}

export async function copyActionContent(action: CopyAction, clipboard: Pick<Clipboard, "writeText"> = navigator.clipboard): Promise<CopyActionIntent> {
  await clipboard.writeText(action.content);
  return createCopyIntent(action);
}
