import { describe, expect, it } from "vitest";
import { companionHostLayers, ProtocolSecurityGuard, recoverHostCase } from "./index.js";
import { attachCompanionGateway, createHealthServer, hostServerLayerReady } from "./server/index.js";

describe("Companion Host public barrels", () => {
  it("publishes the stable runtime layers and root contracts", () => {
    expect(companionHostLayers).toEqual(["server", "orchestrator", "protocol", "cache", "diagnostics", "security"]);
    expect(ProtocolSecurityGuard).toBeTypeOf("function");
    expect(recoverHostCase).toBeTypeOf("function");
  });

  it("publishes server construction without starting a listener", () => {
    expect(hostServerLayerReady).toBe(false);
    expect(attachCompanionGateway).toBeTypeOf("function");
    expect(createHealthServer).toBeTypeOf("function");
  });
});
