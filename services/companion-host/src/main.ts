import type { AddressInfo } from "node:net";
import { loadCompanionHostConfig } from "./config.js";
import { closeHealthServer, startHealthServer } from "./server/health-server.js";

const server = await startHealthServer(loadCompanionHostConfig());
const address = server.address() as AddressInfo;
console.log(JSON.stringify({ event: "companion_host.ready", host: address.address, port: address.port, protocol: "health-only" }));

let stopping = false;
async function stop(signal: string) {
  if (stopping) return;
  stopping = true;
  await closeHealthServer(server);
  console.log(JSON.stringify({ event: "companion_host.stopped", signal }));
}

function stopForSignal(signal: "SIGINT" | "SIGTERM") {
  void stop(signal).catch((error) => {
    console.error(JSON.stringify({ event: "companion_host.stop_failed", signal, message: error instanceof Error ? error.message : "UNKNOWN" }));
    process.exitCode = 1;
  });
}

process.once("SIGINT", () => stopForSignal("SIGINT"));
process.once("SIGTERM", () => stopForSignal("SIGTERM"));
