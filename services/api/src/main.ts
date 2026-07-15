import { loadEnv } from "./config/env.js";
import { createApp } from "./app.js";
import { prisma } from "./core/db/prisma.js";
import { logEvent } from "./core/diagnostics/logger.js";
import { createApiRuntime } from "./runtime/api-lifecycle.js";

const env = loadEnv();
const runtime = createApiRuntime({
  application: createApp(),
  prisma,
  env
});

runtime.listen(env.port, () => {
  logEvent("info", "api.listening", { port: env.port });
});
