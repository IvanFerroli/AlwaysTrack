export const connectionStates = ["DISCONNECTED", "PAIRING_REQUIRED", "CONNECTING", "CONNECTED", "RECONNECTING", "ORIGIN_REJECTED", "VERSION_MISMATCH", "HOST_UNAVAILABLE"] as const;
export type ConnectionState = (typeof connectionStates)[number];

export function reconnectDelay(attempt: number, random = Math.random): number {
  return Math.min(15_000, 500 * 2 ** Math.min(attempt, 5)) + Math.floor(random() * 250);
}
