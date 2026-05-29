import { spawn } from "node:child_process";

const port = process.env.SMOKE_API_PORT ?? "3399";
const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "AdminSmoke123456!";
const env = {
  ...process.env,
  API_PORT: port,
  SEED_ADMIN_PASSWORD: adminPassword,
  SEED_RT_PASSWORD: process.env.SEED_RT_PASSWORD ?? "RtSmoke123456!",
  SEED_SUPERVISOR_PASSWORD: process.env.SEED_SUPERVISOR_PASSWORD ?? "SupervisorSmoke123456!",
  SEED_UPLOAD_TOKEN: process.env.SEED_UPLOAD_TOKEN ?? "UploadSmoke123456!",
  SESSION_SECRET: process.env.SESSION_SECRET ?? "local-smoke-session-secret-1234567890",
  NOTIFICATION_PROVIDER: process.env.NOTIFICATION_PROVIDER ?? "fake"
};

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { env, stdio: "inherit", shell: process.platform === "win32", ...options });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}`));
      }
    });
  });
}

async function waitForHealth(baseUrl) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 20_000) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // API ainda subindo.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("API healthcheck did not become ready.");
}

async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    ...options
  });
  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`${path} failed: ${payload.error?.message ?? response.status}`);
  }
  return { response, payload };
}

async function smokeHttp(baseUrl) {
  await waitForHealth(baseUrl);
  const login = await request(baseUrl, "/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@example.com", password: adminPassword })
  });
  const cookie = login.response.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) throw new Error("Login did not return a session cookie.");
  const headers = { cookie };
  await request(baseUrl, "/v1/auth/me", { headers });
  const dashboard = await request(baseUrl, "/v1/dashboard", { headers });
  if (typeof dashboard.payload.data.metrics?.wiki?.pendingRequests !== "number") {
    throw new Error("Dashboard wiki metric is missing.");
  }
  const wiki = await request(baseUrl, "/v1/wiki/pages", { headers });
  if (!Array.isArray(wiki.payload.data.items) || wiki.payload.data.items.length === 0) {
    throw new Error("Wiki seed page was not found.");
  }
}

async function stopApi(child) {
  const exited = new Promise((resolve) => child.once("exit", resolve));
  if (child.pid) {
    if (process.platform === "win32") {
      child.kill("SIGTERM");
    } else {
      process.kill(-child.pid, "SIGTERM");
    }
  }
  await Promise.race([exited, new Promise((resolve) => setTimeout(resolve, 2_000))]);
  if (child.exitCode === null && child.pid) {
    if (process.platform === "win32") {
      child.kill("SIGKILL");
    } else {
      process.kill(-child.pid, "SIGKILL");
    }
  }
}

async function main() {
  await run("npm", ["run", "env:check"]);
  await run("npm", ["run", "setup"]);
  await run("npm", ["run", "env:check", "--", "--production"], {
    env: {
      ...env,
      DATABASE_URL: "file:./prod.db",
      SESSION_SECRET: "abcdefghijklmnopqrstuvwxyz1234567890ABCD",
      CORS_ORIGIN: "https://app.example.com",
      VITE_API_BASE_URL: "https://api.example.com"
    }
  });

  const api = spawn("npx", ["tsx", "services/api/src/main.ts"], {
    env,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32"
  });

  api.stdout.on("data", (chunk) => process.stdout.write(`[api] ${chunk}`));
  api.stderr.on("data", (chunk) => process.stderr.write(`[api] ${chunk}`));

  try {
    await smokeHttp(`http://localhost:${port}`);
    console.log("[smoke:beta-local] ok");
  } finally {
    await stopApi(api);
  }
}

main().catch((error) => {
  console.error(`[smoke:beta-local] ${error.message}`);
  process.exit(1);
});
