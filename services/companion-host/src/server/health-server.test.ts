import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";
import { loadCompanionHostConfig } from "../config.js";
import { closeHealthServer, startHealthServer } from "./health-server.js";

let server: Server | undefined;

afterEach(async () => {
  if (server) await closeHealthServer(server);
  server = undefined;
});

describe("Companion Host health shell", () => {
  it("serves redacted health only on loopback and releases the port", async () => {
    server = await startHealthServer({ host: "127.0.0.1", port: 0 });
    const address = server.address() as AddressInfo;
    expect(address.address).toBe("127.0.0.1");

    const response = await fetch(`http://127.0.0.1:${address.port}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, service: "alwaystrack-companion-host", protocol: "health-only" });
    expect((await fetch(`http://127.0.0.1:${address.port}/other`)).status).toBe(404);

    await closeHealthServer(server);
    expect(server.listening).toBe(false);
    server = undefined;
  });

  it.each(["0.0.0.0", "192.168.1.10", "::", "localhost"])("rejects unsafe bind %s", (host) => {
    expect(() => loadCompanionHostConfig({ COMPANION_HOST_BIND: host })).toThrow("must be 127.0.0.1");
  });

  it("rejects invalid ports", () => {
    expect(() => loadCompanionHostConfig({ COMPANION_HOST_PORT: "70000" })).toThrow("between 0 and 65535");
  });
});
