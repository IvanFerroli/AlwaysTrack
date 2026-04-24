import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { ResumeProfilesService } from "./resume-profiles.service.js";

test("resume profiles list includes seeded default and supports create", () => {
  const store = new InMemoryStateStore();
  const service = new ResumeProfilesService(store);

  const initial = service.list();
  assert.equal(initial.ok, true);
  if (!initial.ok) {
    throw new Error("expected profile list to succeed");
  }
  assert.equal(initial.data.items.length >= 1, true);

  const created = service.create({
    headline: "Platform Engineer",
    skills: ["node", "typescript", "observability"]
  });
  assert.equal(created.ok, true);
  if (!created.ok) {
    throw new Error("expected profile create to succeed");
  }
  assert.equal(created.data.skills.includes("observability"), true);

  const lookup = service.getById(created.data.id);
  assert.equal(lookup.ok, true);
  if (!lookup.ok) {
    throw new Error("expected profile lookup to succeed");
  }
  assert.equal(lookup.data.headline, "Platform Engineer");
});
