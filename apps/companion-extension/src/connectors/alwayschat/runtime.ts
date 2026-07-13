import { alwaysChatIntakeToEvidenceFacts, parseAlwaysChatIntake, type AlwaysChatIntake, type ParserFactContext } from "@alwaystrack/shared";

export type AlwaysChatRuntimeState =
  | { status: "COMPLETED"; intake: AlwaysChatIntake; facts: ReturnType<typeof alwaysChatIntakeToEvidenceFacts>; needsMoreHistory: boolean }
  | { status: "BLOCKED_LOGIN" }
  | { status: "FAILED_TIMEOUT" }
  | { status: "FAILED_SELECTOR_DRIFT"; field?: string }
  | { status: "FAILED"; message: string };

export interface AlwaysChatReadOnlySource {
  readonly mode: "READ_ONLY";
  read(signal: AbortSignal): Promise<unknown>;
}

export async function runAlwaysChatIntake(
  source: AlwaysChatReadOnlySource,
  context: ParserFactContext,
  signal: AbortSignal
): Promise<AlwaysChatRuntimeState> {
  try {
    const raw = await source.read(signal);
    if (isState(raw, "login")) return { status: "BLOCKED_LOGIN" };
    if (isState(raw, "timeout")) return { status: "FAILED_TIMEOUT" };
    if (isState(raw, "drift")) return { status: "FAILED_SELECTOR_DRIFT", field: stringField(raw, "field") };
    const record = asRecord(raw);
    const intake = parseAlwaysChatIntake(record.intake ?? raw);
    return {
      status: "COMPLETED",
      intake,
      facts: alwaysChatIntakeToEvidenceFacts(intake, context),
      needsMoreHistory: record.historyComplete === false
    };
  } catch (error) {
    if (signal.aborted) return { status: "FAILED", message: "CANCELLED" };
    return { status: "FAILED_SELECTOR_DRIFT", field: error instanceof Error ? error.message : undefined };
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function isState(value: unknown, state: string): boolean { return asRecord(value).state === state; }
function stringField(value: unknown, field: string): string | undefined {
  const candidate = asRecord(value)[field];
  return typeof candidate === "string" ? candidate : undefined;
}
