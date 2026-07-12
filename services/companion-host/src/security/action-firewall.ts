import { enforceActionFirewall, type ActionFirewallAttempt, type ActionFirewallResult, type ActionFirewallScope } from "@alwaystrack/shared";

export function enforceHostAction(attempt: ActionFirewallAttempt, scope: ActionFirewallScope): ActionFirewallResult {
  return enforceActionFirewall(attempt, scope);
}
