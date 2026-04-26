import { strict as assert } from "node:assert";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { ResumeProfilesService } from "./resume-profiles.service.js";

test("resume profiles list includes seeded default and supports create", async () => {
  const store = new InMemoryStateStore();
  const service = new ResumeProfilesService(store);

  const initial = await service.list();
  assert.equal(initial.ok, true);
  if (!initial.ok) {
    throw new Error("expected profile list to succeed");
  }
  assert.equal(initial.data.items.length >= 1, true);

  const created = await service.create({
    headline: "Platform Engineer",
    skills: ["node", "typescript", "observability"]
  });
  assert.equal(created.ok, true);
  if (!created.ok) {
    throw new Error("expected profile create to succeed");
  }
  assert.equal(created.data.skills.includes("observability"), true);

  const lookup = await service.getById(created.data.id);
  assert.equal(lookup.ok, true);
  if (!lookup.ok) {
    throw new Error("expected profile lookup to succeed");
  }
  assert.equal(lookup.data.headline, "Platform Engineer");
});

test("resume profiles service lists CV sources and creates profile from CV text analysis", async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "olympus-cv-"));
  const cvFile = path.join(tempRoot, "EN-CV_TEST.txt");
  await writeFile(
    cvFile,
    [
      "Tech Stack",
      "Languages: JavaScript, TypeScript, SQL",
      "Front-End: React, Next.js, TailwindCSS",
      "Back-End: Node.js, Express, NestJS",
      "Infrastructure & DevOps: Docker, AWS"
    ].join("\n"),
    "utf-8"
  );

  try {
    const store = new InMemoryStateStore();
    const service = new ResumeProfilesService(store, { cvSourcesDir: tempRoot });

    const sources = await service.listMainCvSources();
    assert.equal(sources.ok, true);
    if (!sources.ok) {
      throw new Error("expected sources list to succeed");
    }
    assert.equal(sources.data.items.length, 1);
    assert.equal(sources.data.items[0]?.fileName, "EN-CV_TEST.txt");

    const analyzed = await service.analyzeMainCv({
      sourceFile: "EN-CV_TEST.txt",
      headline: "Main CV Profile",
      extraSkills: ["playwright", "cypress"]
    });
    assert.equal(analyzed.ok, true);
    if (!analyzed.ok) {
      throw new Error("expected CV analysis to succeed");
    }
    assert.equal(analyzed.data.resumeProfile.headline, "Main CV Profile");
    assert.equal(analyzed.data.resumeProfile.skills.includes("typescript"), true);
    assert.equal(analyzed.data.resumeProfile.skills.includes("node.js"), true);
    assert.equal(analyzed.data.resumeProfile.skills.includes("playwright"), true);
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
});
