import { strict as assert } from "node:assert";
import test from "node:test";
import { makeHealthService } from "./health.service.js";

test("health service returns stable payload shape", () => {
  const service = makeHealthService(Date.now() - 10);
  const result = service();

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("expected successful health result");
  }

  assert.equal(result.data.service, "api");
  assert.equal(result.data.status, "ok");
  assert.ok(result.data.uptimeMs >= 0);
  assert.ok(result.data.timestamp.length > 0);
});
