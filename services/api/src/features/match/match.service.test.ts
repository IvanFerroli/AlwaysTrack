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

test("match service supports multi-select filters from dashboard", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);
  const profile = await store.createResumeProfile({
    headline: "Frontend Engineer",
    skills: ["react", "node.js"]
  });

  await ingestion.ingest({
    title: "Junior React Developer",
    companyName: "One",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/filter-1",
    description: "React UI",
    location: "Brazil"
  });
  await ingestion.ingest({
    title: "Senior Java Engineer",
    companyName: "Two",
    sourceName: "Gupy",
    sourceUrl: "https://gupy.test/job/filter-2",
    description: "Java backend",
    location: "Portugal"
  });

  const result = await match.listRanked(profile.id, {
    q: ["junior", "react"],
    sourceName: ["LinkedIn", "Gupy"],
    location: ["Brazil"],
    status: ["new"]
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("expected ranked list to succeed");
  }
  assert.equal(result.data.items.length, 1);
  assert.equal(result.data.items[0]?.title, "Junior React Developer");
  assert.equal(result.data.items[0]?.matchedSkills.includes("react"), true);
});

test("match service prioritizes keyword hits in title when q is provided", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);

  await ingestion.ingest({
    title: "Senior Engineer",
    companyName: "One",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/key-1",
    description: "Strong React.js stack and UI architecture",
    location: "Remote"
  });
  await ingestion.ingest({
    title: "Senior React Engineer",
    companyName: "Two",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/key-2",
    description: "Frontend architecture and testing",
    location: "Remote"
  });

  const result = await match.listRanked(undefined, {
    q: ["react"],
    status: ["new"]
  });

  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error("expected ranked list to succeed");
  }
  assert.equal(result.data.items.length >= 2, true);
  assert.equal(result.data.items[0]?.title, "Senior React Engineer");
});

test("match service uses resume-000001 as default ranking profile", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);

  await store.createResumeProfile({
    headline: "Frontend Specialist",
    skills: ["react"]
  });

  await ingestion.ingest({
    title: "React Engineer",
    companyName: "UI Corp",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/default-profile",
    description: "React and CSS",
    location: "Remote"
  });

  const ranked = await match.listRanked();
  assert.equal(ranked.ok, true);
  if (!ranked.ok) {
    throw new Error("expected ranked list to succeed");
  }

  // resume-000001 default profile is node/typescript/api and should not match pure React posting.
  assert.equal(ranked.data.items[0]?.score, 0);
});

test("match service infers seniority and defaults to mid when unspecified", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);

  const juniorJob = await ingestion.ingest({
    title: "Junior React Developer",
    companyName: "Alpha",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/seniority-jr",
    description: "Frontend React role",
    location: "Remote"
  });
  assert.equal(juniorJob.ok, true);

  const midJob = await ingestion.ingest({
    title: "React Developer",
    companyName: "Beta",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/seniority-mid-default",
    description: "Product engineering role",
    location: "Remote"
  });
  assert.equal(midJob.ok, true);

  const ranked = await match.listRanked(undefined, { seniority: ["mid"] });
  assert.equal(ranked.ok, true);
  if (!ranked.ok) {
    throw new Error("expected ranked list to succeed");
  }

  assert.equal(ranked.data.items.length, 1);
  assert.equal(ranked.data.items[0]?.title, "React Developer");
  assert.equal(ranked.data.items[0]?.seniority, "mid");
  assert.equal(ranked.data.items[0]?.tags.includes("seniority:mid"), true);
});

test("match service composes filters with seniority, date sort and pagination", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);
  const profile = await store.createResumeProfile({
    headline: "React Engineer",
    skills: ["react", "typescript", "node.js"]
  });

  const junior = await ingestion.ingest({
    title: "Junior React Developer",
    companyName: "A",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/compose-1",
    description: "React and Typescript",
    location: "Brazil",
    postedAt: "2026-04-20T12:00:00.000Z"
  });
  assert.equal(junior.ok, true);
  if (!junior.ok) throw new Error("expected junior ingestion");
  await ingestion.updateJob(junior.data.jobPosting.id, { addTag: "focus-react" });

  const mid = await ingestion.ingest({
    title: "React Developer",
    companyName: "B",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/compose-2",
    description: "React frontend and node integrations",
    location: "Brazil",
    postedAt: "2026-04-21T12:00:00.000Z"
  });
  assert.equal(mid.ok, true);
  if (!mid.ok) throw new Error("expected mid ingestion");
  await ingestion.updateJob(mid.data.jobPosting.id, { addTag: "focus-react" });

  const senior = await ingestion.ingest({
    title: "Senior React Engineer",
    companyName: "C",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/compose-3",
    description: "React architecture",
    location: "Brazil",
    postedAt: "2026-04-22T12:00:00.000Z"
  });
  assert.equal(senior.ok, true);
  if (!senior.ok) throw new Error("expected senior ingestion");
  await ingestion.updateJob(senior.data.jobPosting.id, { addTag: "focus-react" });

  const nonMatchingSource = await ingestion.ingest({
    title: "React Developer",
    companyName: "D",
    sourceName: "Gupy",
    sourceUrl: "https://gupy.test/job/compose-4",
    description: "React frontend",
    location: "Brazil",
    postedAt: "2026-04-23T12:00:00.000Z"
  });
  assert.equal(nonMatchingSource.ok, true);
  if (!nonMatchingSource.ok) throw new Error("expected fallback ingestion");
  await ingestion.updateJob(nonMatchingSource.data.jobPosting.id, { addTag: "focus-react" });

  const page1 = await match.listRanked(profile.id, {
    q: ["react"],
    status: ["new"],
    sourceName: ["linkedin"],
    location: ["brazil"],
    tags: ["focus-react"],
    seniority: ["junior", "mid"],
    sortByDate: "newest",
    page: 1,
    pageSize: 1
  });
  assert.equal(page1.ok, true);
  if (!page1.ok) throw new Error("expected ranked list page 1");

  assert.equal(page1.data.total, 2);
  assert.equal(page1.data.totalPages, 2);
  assert.equal(page1.data.page, 1);
  assert.equal(page1.data.pageSize, 1);
  assert.equal(page1.data.items.length, 1);
  assert.equal(page1.data.items[0]?.title, "React Developer");
  assert.equal(page1.data.items[0]?.seniority, "mid");

  const page2 = await match.listRanked(profile.id, {
    q: ["react"],
    status: ["new"],
    sourceName: ["linkedin"],
    location: ["brazil"],
    tags: ["focus-react"],
    seniority: ["junior", "mid"],
    sortByDate: "newest",
    page: 2,
    pageSize: 1
  });
  assert.equal(page2.ok, true);
  if (!page2.ok) throw new Error("expected ranked list page 2");

  assert.equal(page2.data.items.length, 1);
  assert.equal(page2.data.items[0]?.title, "Junior React Developer");
  assert.equal(page2.data.items[0]?.seniority, "junior");

  const oldestFirst = await match.listRanked(profile.id, {
    status: ["new"],
    sourceName: ["linkedin"],
    location: ["brazil"],
    tags: ["focus-react"],
    seniority: ["junior", "mid"],
    sortByDate: "oldest",
    page: 1,
    pageSize: 2
  });
  assert.equal(oldestFirst.ok, true);
  if (!oldestFirst.ok) throw new Error("expected ranked list oldest first");

  assert.equal(oldestFirst.data.items[0]?.title, "Junior React Developer");
  assert.equal(oldestFirst.data.items[1]?.title, "React Developer");
});

test("match service defaults sortByDate to none (affinity-first)", async () => {
  const store = new InMemoryStateStore();
  const ingestion = new IngestionService(store);
  const match = new MatchService(store);
  const profile = await store.createResumeProfile({
    headline: "Node React Engineer",
    skills: ["react", "node.js", "typescript"]
  });

  const olderHighAffinity = await ingestion.ingest({
    title: "React Node Developer",
    companyName: "A",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/sort-none-a",
    description: "react node typescript",
    postedAt: "2026-04-20T12:00:00.000Z"
  });
  assert.equal(olderHighAffinity.ok, true);

  const newerLowAffinity = await ingestion.ingest({
    title: "Frontend Developer",
    companyName: "B",
    sourceName: "LinkedIn",
    sourceUrl: "https://linkedin.test/job/sort-none-b",
    description: "html css",
    postedAt: "2026-04-22T12:00:00.000Z"
  });
  assert.equal(newerLowAffinity.ok, true);

  const ranked = await match.listRanked(profile.id);
  assert.equal(ranked.ok, true);
  if (!ranked.ok) throw new Error("expected ranked list");

  assert.equal(ranked.data.sortByDate, "none");
  assert.equal(ranked.data.items[0]?.title, "React Node Developer");
});
