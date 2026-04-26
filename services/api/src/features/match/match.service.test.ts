import { strict as assert } from "node:assert";
import test from "node:test";
import { InMemoryStateStore } from "../../domain/state/store.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { MatchService } from "./match.service.js";

test("match service scores based on normalized token overlap", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);

  const ingested = await ingestion.ingest({
    title: "Backend Engineer Node",
    companyName: "Olympus",
    sourceName: "linkedin",
    sourceUrl: "https://linkedin.test/job/2",
    description: "TypeScript Node API reliability",
    location: "remote"
  });

  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const result = await match.score({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Backend developer",
      skills: ["node", "typescript", "graphql"],
      createdAt: new Date().toISOString()
    }
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("expected match to succeed");
  }

  assert.equal(result.data.matchedSkills.includes("node"), true);
  assert.equal(result.data.matchedSkills.includes("typescript"), true);
  assert.equal(result.data.missingSkills.includes("graphql"), true);
  assert.ok(result.data.score >= 60);
});

test("match service treats dotted skills as token groups", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);

  const ingested = await ingestion.ingest({
    title: "Senior Node.js Next.js Engineer",
    companyName: "Olympus",
    sourceName: "linkedin",
    sourceUrl: "https://linkedin.test/job/dotted-skills",
    description: "Build TypeScript APIs with Node.js and Next.js.",
    location: "remote"
  });

  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const result = await match.score({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Node.js Next.js Engineer",
      skills: ["node.js", "typescript", "next.js"],
      createdAt: new Date().toISOString()
    }
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("expected match to succeed");
  }

  assert.deepEqual(result.data.matchedSkills.sort(), ["next.js", "node.js", "typescript"]);
  assert.equal(result.data.missingSkills.length, 0);
  assert.equal(result.data.score, 100);
});

test("match service scores public platform cards by title skill aliases", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);

  const ingested = await ingestion.ingest({
    title: "Junior Full Stack Developer | Node and React",
    companyName: "Getnet",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/title-card",
    description: "LinkedIn public search result. Open the source URL for the complete job description.",
    location: "Brazil"
  });

  assert.equal(ingested.ok, true);
  if (!ingested.ok) {
    throw new Error("expected ingestion to succeed");
  }

  const result = await match.score({
    jobPostingId: ingested.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Main CV",
      skills: ["node.js", "react", "typescript", "postgresql"],
      createdAt: new Date().toISOString()
    }
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("expected match to succeed");
  }

  assert.equal(result.data.matchedSkills.includes("node.js"), true);
  assert.equal(result.data.matchedSkills.includes("react"), true);
  assert.ok(result.data.score >= 70);
});

test("match service handles compact stack aliases without generic headline inflation", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);

  const stackJob = await ingestion.ingest({
    title: "Full-stack Node/React Developer",
    companyName: "Stack Co",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/fullstack-node-react",
    description: "Public card with compact title only.",
    location: "Remote"
  });

  assert.equal(stackJob.ok, true);
  if (!stackJob.ok) {
    throw new Error("expected stack job ingestion to succeed");
  }

  const stackResult = await match.score({
    jobPostingId: stackJob.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Senior Software Engineer",
      skills: ["nodejs", "react.js", "postgresql"],
      createdAt: new Date().toISOString()
    }
  });

  assert.equal(stackResult.ok, true);
  if (!stackResult.ok) {
    throw new Error("expected stack match to succeed");
  }
  assert.deepEqual(stackResult.data.matchedSkills.sort(), ["nodejs", "react.js"]);
  assert.ok(stackResult.data.score >= 70);

  const genericJob = await ingestion.ingest({
    title: "Senior Software Engineer",
    companyName: "Generic Co",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/generic-engineer",
    description: "Public card without technical stack.",
    location: "Remote"
  });

  assert.equal(genericJob.ok, true);
  if (!genericJob.ok) {
    throw new Error("expected generic job ingestion to succeed");
  }

  const genericResult = await match.score({
    jobPostingId: genericJob.data.jobPosting.id,
    resumeProfile: {
      id: "resume-1",
      headline: "Senior Software Engineer",
      skills: ["nodejs", "react.js", "postgresql"],
      createdAt: new Date().toISOString()
    }
  });

  assert.equal(genericResult.ok, true);
  if (!genericResult.ok) {
    throw new Error("expected generic match to succeed");
  }
  assert.equal(genericResult.data.score, 0);
});
