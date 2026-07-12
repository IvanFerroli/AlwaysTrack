import type { AddressInfo } from "node:net";
import { loadCompanionHostConfig } from "./config.js";
import { closeCompanionServer, startCompanionServer } from "./server/health-server.js";

const running = await startCompanionServer(loadCompanionHostConfig());
const server = running.server;
const address = server.address() as AddressInfo;
console.log(JSON.stringify({ event: "companion_host.ready", host: address.address, port: address.port, protocol: "websocket" }));

let stopping = false;
async function stop(signal: string) {
  if (stopping) return;
  stopping = true;
  await closeCompanionServer(running);
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
