import assert from "node:assert/strict";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { FakeCompanionHost } from "../tests/extension-e2e/fake-companion-host.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const extensionPath = resolve(root, "apps/companion-extension/dist");
const fixturePath = resolve(root, "tests/extension-e2e/fixture-page.html");
const checks = [];
const limitations = [];

async function chromiumExecutable() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const headlessShell = chromium.executablePath();
  if (/\/chromium-\d+\/chrome-linux64\/chrome$/.test(headlessShell)) return headlessShell;
  const version = headlessShell.match(/chromium_headless_shell-(\d+)/)?.[1];
  if (!version) throw new Error("Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to a full Chromium binary");
  const candidate = resolve(headlessShell, "../../../", `chromium-${version}/chrome-linux64/chrome`);
  await access(candidate);
  return candidate;
}

function passed(name, detail) {
  checks.push(detail ? { name, detail } : { name });
}

async function waitFor(predicate, description, timeoutMs = 8_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const result = await predicate();
    if (result) return result;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
  }
  throw new Error(`Timeout waiting for ${description}`);
}

async function startFixtureServer() {
  const html = await readFile(fixturePath);
  const server = createServer((request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    response.end(html);
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  assert(address && typeof address === "object");
  return { server, url: `http://127.0.0.1:${address.port}/fixture` };
}

async function installMessageRecorder(page) {
  await page.evaluate(() => {
    globalThis.__mv3Messages = [];
    chrome.runtime.onMessage.addListener((message) => globalThis.__mv3Messages.push(message));
  });
}

async function recordedStates(page) {
  return page.evaluate(() => globalThis.__mv3Messages
    .filter((message) => message?.type === "COMPANION_CONNECTION_STATE")
    .map((message) => message.state));
}

async function sendPairing(page, token) {
  await page.evaluate((pairingToken) => chrome.runtime.sendMessage({ type: "PAIR_COMPANION", token: pairingToken }), token);
}

let context;
let profilePath;
let fixture;
const host = new FakeCompanionHost();

try {
  const manifest = JSON.parse(await readFile(resolve(extensionPath, "manifest.json"), "utf8"));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ["sidePanel", "tabs"]);
  assert.equal(manifest.host_permissions, undefined);
  passed("manifest MV3 and permission allowlist");

  profilePath = await mkdtemp(resolve(tmpdir(), "alwaystrack-mv3-"));
  fixture = await startFixtureServer();
  await host.start();
  const executablePath = await chromiumExecutable();
  context = await chromium.launchPersistentContext(profilePath, {
    executablePath,
    headless: true,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    serviceWorkers: "allow"
  });

  const serviceWorker = context.serviceWorkers()[0]
    ?? await context.waitForEvent("serviceworker", { timeout: 10_000 });
  const extensionId = new URL(serviceWorker.url()).host;
  assert.match(serviceWorker.url(), /^chrome-extension:\/\/[^/]+\/service-worker\.js$/);
  passed("unpacked extension service worker started", { extensionId });

  const panelUrl = `chrome-extension://${extensionId}/side-panel/index.html`;
  const panel = await context.newPage();
  const observer = await context.newPage();
  await Promise.all([panel.goto(panelUrl), observer.goto(panelUrl)]);
  await installMessageRecorder(panel);
  await installMessageRecorder(observer);
  assert.equal(await panel.locator("h1").textContent(), "Copiloto SAC");
  assert.equal(await panel.locator("#host-status").textContent(), "Companion indisponivel");
  passed("side panel rendered in extension origin");

  const browserPermissions = await panel.evaluate(() => chrome.permissions.getAll());
  assert.deepEqual([...browserPermissions.permissions].sort(), ["sidePanel", "tabs"]);
  assert.deepEqual(browserPermissions.origins ?? [], []);
  passed("runtime permissions stay inside allowlist");

  await panel.locator(".choice-button").first().click();
  const chosenIntent = await waitFor(async () => observer.evaluate(() => globalThis.__mv3Messages
    .find((message) => message?.type === "CASE_FLOW_STEP_CHOSEN")), "guided-flow intent");
  assert.deepEqual(chosenIntent.payload, { stepId: "confirm-logistics", optionId: "within-forecast" });
  passed("guided flow emits internal intent without external action");

  await sendPairing(panel, "pair-token");
  await waitFor(async () => (await recordedStates(panel)).includes("CONNECTED"), "initial pairing");
  assert.equal(await panel.locator("#host-status").textContent(), "Companion conectado");
  assert.equal(host.helloEvents.at(-1).tokenClass, "pairing");
  passed("pairing with controlled Host");

  host.dropConnections();
  await waitFor(async () => (await recordedStates(panel)).includes("HOST_UNAVAILABLE"), "safe Host degradation");
  await waitFor(async () => host.helloEvents.length >= 2, "reconnect handshake");
  await waitFor(async () => (await recordedStates(panel)).filter((state) => state === "CONNECTED").length >= 2, "reconnected state");
  assert.equal(host.helloEvents.at(-1).tokenClass, "reconnect");
  passed("Host drop degrades and reconnects with rotated token");

  await sendPairing(panel, "origin-rejected");
  await waitFor(async () => (await recordedStates(panel)).includes("ORIGIN_REJECTED"), "terminal origin rejection");
  assert.equal(await panel.locator("#host-status").textContent(), "Companion indisponivel");
  passed("terminal Host rejection fails closed");

  await sendPairing(panel, "pair-after-rejection");
  await waitFor(async () => (await recordedStates(panel)).filter((state) => state === "CONNECTED").length >= 3, "manual repair after rejection");
  passed("manual re-pair recovers after terminal rejection");

  const fixturePage = await context.newPage();
  await fixturePage.goto(fixture.url);
  const fixtureTabId = await panel.evaluate(async (url) => (await chrome.tabs.query({})).find((tab) => tab.url === url)?.id, fixture.url);
  assert.equal(typeof fixtureTabId, "number");
  const contentScriptReachable = await panel.evaluate(async (tabId) => {
    try {
      await chrome.tabs.sendMessage(tabId, {
        type: "CAPTURE_READ_ONLY_SNAPSHOT",
        policy: { version: "mv3-e2e", selectors: [{ key: "status", strategy: "DATA_ATTRIBUTE", selector: "[data-order-status]" }] }
      });
      return true;
    } catch {
      return false;
    }
  }, fixtureTabId);
  assert.equal(contentScriptReachable, false);
  assert.equal(manifest.content_scripts, undefined);
  limitations.push("content-scripts/index.js is built but not declared in manifest.json, so real page injection/intake is not reachable");

  const cdp = await context.newCDPSession(panel);
  const targets = await cdp.send("Target.getTargets");
  const workerTarget = targets.targetInfos.find((target) => target.type === "service_worker" && target.url === serviceWorker.url());
  if (workerTarget) {
    await cdp.send("Target.closeTarget", { targetId: workerTarget.targetId });
    await panel.reload();
    const resumedWorker = context.serviceWorkers().find((worker) => worker.url() === serviceWorker.url())
      ?? await context.waitForEvent("serviceworker", { timeout: 5_000 }).catch(() => undefined);
    if (resumedWorker) {
      passed("service worker suspended and resumed by extension activity");
      const helloCountAfterRestart = host.helloEvents.length;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, 900));
      assert.equal(host.helloEvents.length, helloCountAfterRestart);
      await installMessageRecorder(panel);
      await sendPairing(panel, "pair-after-worker-restart");
      await waitFor(async () => (await recordedStates(panel)).includes("CONNECTED"), "pairing after worker restart");
      passed("service worker restart recovers through explicit re-pair");
      limitations.push("pairing/reconnect token is memory-only; service worker restart requires a new explicit pairing");
    } else {
      limitations.push("Chromium closed the service worker target but did not expose a resumed worker within the local timeout");
    }
  } else {
    limitations.push("Chromium did not expose the MV3 service worker CDP target for an explicit suspend/resume check");
  }

  console.log(JSON.stringify({
    task: "TASK-AT-318",
    evidence: "local/fake",
    checks,
    host: { helloEvents: host.helloEvents },
    limitations,
    sensitiveArtifactsPersisted: false
  }, null, 2));
} finally {
  await context?.close().catch(() => undefined);
  await host.stop().catch(() => undefined);
  if (fixture?.server) await new Promise((resolveClose) => fixture.server.close(resolveClose));
  if (profilePath) await rm(profilePath, { recursive: true, force: true });
}
