import type { CaseFlowMessageChannel, CompiledCaseFlowMessage } from "@alwaystrack/shared";

export interface MessageChannelGroup {
  channel: CaseFlowMessageChannel;
  customerVisible: boolean;
  messages: CompiledCaseFlowMessage[];
}

const customerChannels = new Set<CaseFlowMessageChannel>(["CUSTOMER", "EMAIL"]);

export function groupCaseFlowMessages(messages: readonly CompiledCaseFlowMessage[]): MessageChannelGroup[] {
  const groups = new Map<CaseFlowMessageChannel, CompiledCaseFlowMessage[]>();
  for (const message of messages) groups.set(message.channel, [...(groups.get(message.channel) ?? []), message]);
  return [...groups].map(([channel, items]) => ({ channel, customerVisible: customerChannels.has(channel), messages: items.sort((left, right) => left.id.localeCompare(right.id)) }));
}

export function copyState(message: CompiledCaseFlowMessage) {
  return message.copyAllowed ? { allowed: true as const, pending: [] as string[] } : { allowed: false as const, pending: message.pendingPlaceholders };
}
