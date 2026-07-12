export interface StepEvidence {
  label: string;
  value: string;
}

export interface StepOption {
  id: string;
  label: string;
}

export interface GuidedStep {
  id: string;
  position: number;
  total: number;
  title: string;
  instruction: string;
  evidence: StepEvidence[];
  message?: string;
  options: StepOption[];
  previousStepAvailable: boolean;
}

export type StepIntent =
  | { type: "CASE_FLOW_STEP_CHOSEN"; payload: { stepId: string; optionId: string } }
  | { type: "CASE_FLOW_STEP_BACK"; payload: { stepId: string } };

export function createStepChoiceIntent(stepId: string, optionId: string): StepIntent {
  return { type: "CASE_FLOW_STEP_CHOSEN", payload: { stepId, optionId } };
}

export function createStepBackIntent(stepId: string): StepIntent {
  return { type: "CASE_FLOW_STEP_BACK", payload: { stepId } };
}
