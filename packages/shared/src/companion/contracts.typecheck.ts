import type { ForbiddenActionCapability } from "../case-flow/action-capabilities.js";
import type { ConnectorExecutableCapability } from "../connectors/connector.js";
import type { CompanionEvent } from "./events.js";
import { assertNeverCompanionEvent } from "./events.js";

const forbiddenCapability: ForbiddenActionCapability = "SUBMIT";
// @ts-expect-error Forbidden capabilities cannot be executable connector capabilities.
const invalidExecutableCapability: ConnectorExecutableCapability = forbiddenCapability;
void invalidExecutableCapability;

export function companionEventTypeForContractCheck(event: CompanionEvent): string {
  switch (event.type) {
    case "COMPANION_HELLO":
    case "COMPANION_PAIRED":
    case "BROWSER_READY":
    case "START_CASE":
    case "CASE_INTAKE":
    case "RUN_CONNECTOR":
    case "CONNECTOR_PROGRESS":
    case "CONNECTOR_RESULT":
    case "INTERVENTION_REQUIRED":
    case "INTERVENTION_RESOLVED":
    case "INSERT_DRAFT":
    case "DRAFT_INSERTED":
    case "CANCEL_RUN":
    case "HEALTH_REPORT":
      return event.type;
    default:
      return assertNeverCompanionEvent(event);
  }
}
