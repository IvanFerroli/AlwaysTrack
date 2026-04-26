const { spawn } = require("node:child_process");

const API_PORT = Number.parseInt(process.env.SMOKE_API_PORT || "3101", 10);
const WEB_PORT = Number.parseInt(process.env.SMOKE_WEB_PORT || "3100", 10);
const HOST = process.env.SMOKE_HOST || "127.0.0.1";
const START_TIMEOUT_MS = Number.parseInt(process.env.SMOKE_START_TIMEOUT_MS || "30000", 10);

const API_BASE_URL = `http://${HOST}:${API_PORT}`;
const WEB_BASE_URL = `http://${HOST}:${WEB_PORT}`;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function tailLogs(logs, lines = 40) {
  return logs
    .trim()
    .split("\n")
    .filter(Boolean)
    .slice(-lines)
    .join("\n");
}

function startProcess(name, command, args, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: { ...process.env, ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"]
  });

  let logs = "";
  child.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });

  return {
    name,
    child,
    getLogs: () => logs
  };
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(url, timeoutMs) {
  const startedAt = Date.now();
  let lastError = "not started";

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = `status=${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(300);
  }

  throw new Error(`Timeout waiting for ${url} (${timeoutMs}ms): ${lastError}`);
}

async function getJson(url) {
  const response = await fetch(url);
  const payload = await response.json();
  return { response, payload };
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  const payload = await response.json();
  return { response, payload };
}

async function stopProcess(proc) {
  if (proc.child.exitCode !== null) {
    return;
  }

  proc.child.kill("SIGTERM");
  const deadline = Date.now() + 4000;
  while (Date.now() < deadline) {
    if (proc.child.exitCode !== null) {
      return;
    }
    await sleep(100);
  }

  if (proc.child.exitCode === null) {
    proc.child.kill("SIGKILL");
  }
}

async function main() {
  const startedAt = Date.now();
  const coveredRoutes = [];
  const processes = [];

  try {
    const api = startProcess("api", "npm", ["run", "dev:api"], {
      NODE_ENV: "test",
      HOST,
      PORT: String(API_PORT),
      SCRAPER_SOURCE_TIMEOUT_MS: "2000",
      PIPELINE_MAX_DURATION_MS: "2000"
    });
    const web = startProcess("web", "npm", ["run", "dev:web"], {
      NODE_ENV: "test",
      HOST,
      PORT: String(WEB_PORT),
      API_BASE_URL,
      WEB_ORIGIN: WEB_BASE_URL
    });
    processes.push(api, web);

    await waitFor(`${API_BASE_URL}/health`, START_TIMEOUT_MS);
    await waitFor(`${WEB_BASE_URL}/health`, START_TIMEOUT_MS);

    const homeRes = await fetch(`${WEB_BASE_URL}/`);
    const homeHtml = await homeRes.text();
    assert(homeRes.status === 200, `GET / expected 200, got ${homeRes.status}`);
    assert(homeHtml.includes("Olympus Climb"), "GET / did not return expected HTML marker");
    coveredRoutes.push("GET web /");

    const apiHealth = await getJson(`${API_BASE_URL}/health`);
    assert(apiHealth.response.status === 200, `GET /health (api) expected 200, got ${apiHealth.response.status}`);
    assert(apiHealth.payload?.ok === true, "GET /health (api) expected ok=true");
    assert(apiHealth.payload?.data?.service === "api", "GET /health (api) expected data.service=api");
    coveredRoutes.push("GET api /health");

    const webHealth = await getJson(`${WEB_BASE_URL}/health`);
    assert(webHealth.response.status === 200, `GET /health (web) expected 200, got ${webHealth.response.status}`);
    assert(webHealth.payload?.ok === true, "GET /health (web) expected ok=true");
    assert(webHealth.payload?.data?.service === "web", "GET /health (web) expected data.service=web");
    assert(typeof webHealth.payload?.data?.api?.ok === "boolean", "GET /health (web) expected nested api health shape");
    coveredRoutes.push("GET web /health");

    const ranked = await getJson(`${API_BASE_URL}/v1/jobs/ranked?page=1&pageSize=5`);
    assert(ranked.response.status === 200, `GET /v1/jobs/ranked expected 200, got ${ranked.response.status}`);
    assert(ranked.payload?.ok === true, "GET /v1/jobs/ranked expected ok=true");
    assert(Array.isArray(ranked.payload?.data?.items), "GET /v1/jobs/ranked expected data.items[]");
    coveredRoutes.push("GET api /v1/jobs/ranked");

    const pipeline = await postJson(`${API_BASE_URL}/v1/pipeline/run`, {
      source: "cryptojobslist",
      includeLlmEnrichment: false,
      shortlistSize: 3,
      maxDurationMs: 2000,
      maxSources: 1
    });
    assert(pipeline.response.status === 200, `POST /v1/pipeline/run expected 200, got ${pipeline.response.status}`);
    assert(pipeline.payload?.ok === true, "POST /v1/pipeline/run expected ok=true");
    assert(typeof pipeline.payload?.data?.runId === "string", "POST /v1/pipeline/run expected data.runId");
    assert(Array.isArray(pipeline.payload?.data?.sourceReports), "POST /v1/pipeline/run expected data.sourceReports[]");
    coveredRoutes.push("POST api /v1/pipeline/run");

    const durationMs = Date.now() - startedAt;
    console.log(`[smoke] PASS (${durationMs}ms)`);
    console.log(`[smoke] Covered routes: ${coveredRoutes.join(", ")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[smoke] FAIL: ${message}`);
    for (const proc of processes) {
      const logTail = tailLogs(proc.getLogs());
      if (logTail) {
        console.error(`\n[smoke] ${proc.name} logs (tail):\n${logTail}`);
      }
    }
    process.exitCode = 1;
  } finally {
    await Promise.all(processes.map((proc) => stopProcess(proc)));
  }
}

main().catch((error) => {
  console.error(`[smoke] Unhandled failure: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
