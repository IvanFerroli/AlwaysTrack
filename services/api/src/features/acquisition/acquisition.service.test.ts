import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseSafePublicUrl } from "./acquisition.service.js";
import { JobAcquisitionService } from "./acquisition.service.js";
import { IngestionService } from "../ingestion/ingestion.service.js";
import { InMemoryStateStore } from "../../domain/state/store.js";

// ── parseSafePublicUrl ────────────────────────────────────────────────────────

describe("parseSafePublicUrl", () => {
  it("returns URL for valid https link", () => {
    const result = parseSafePublicUrl("https://example.com/job/123");
    assert.ok(result instanceof URL);
    assert.equal(result.protocol, "https:");
  });

  it("returns URL for valid http link", () => {
    const result = parseSafePublicUrl("http://example.com/job");
    assert.ok(result instanceof URL);
  });

  it("returns undefined for localhost", () => {
    assert.equal(parseSafePublicUrl("http://localhost:3000"), undefined);
  });

  it("returns undefined for 127.0.0.1", () => {
    assert.equal(parseSafePublicUrl("http://127.0.0.1/secret"), undefined);
  });

  it("returns undefined for IPv6 loopback", () => {
    assert.equal(parseSafePublicUrl("http://[::1]/secret"), undefined);
  });

  it("returns undefined for private ip 192.168.x.x", () => {
    assert.equal(parseSafePublicUrl("http://192.168.1.1/path"), undefined);
  });

  it("returns undefined for private ip 10.x.x.x", () => {
    assert.equal(parseSafePublicUrl("http://10.0.0.5/path"), undefined);
  });

  it("returns undefined for private ip 172.16-31.x.x", () => {
    assert.equal(parseSafePublicUrl("http://172.16.0.5/path"), undefined);
  });

  it("returns undefined for .local host", () => {
    assert.equal(parseSafePublicUrl("http://myservice.local/job"), undefined);
  });

  it("returns undefined for non-http protocol", () => {
    assert.equal(parseSafePublicUrl("ftp://example.com/file"), undefined);
  });

  it("returns undefined for empty string", () => {
    assert.equal(parseSafePublicUrl(""), undefined);
  });

  it("returns undefined for non-string", () => {
    assert.equal(parseSafePublicUrl(42), undefined);
    assert.equal(parseSafePublicUrl(null), undefined);
  });

  it("returns undefined for string exceeding 2048 chars", () => {
    const url = "https://example.com/" + "a".repeat(2050);
    assert.equal(parseSafePublicUrl(url), undefined);
  });
});

// ── JobAcquisitionService ─────────────────────────────────────────────────────

function makeService() {
  const store = new InMemoryStateStore();
  const ingestionService = new IngestionService(store);
  return new JobAcquisitionService(ingestionService);
}

describe("JobAcquisitionService.acquire — smart-paste", () => {
  it("returns ACQUISITION_PARSE_FAILED when rawText is too short", async () => {
    const service = makeService();
    const result = await service.acquire({ method: "smart-paste", rawText: "hi" });
    assert.equal(result.ok, false);
    assert.ok(!result.ok && result.error.code === "ACQUISITION_PARSE_FAILED");
  });

  it("returns ACQUISITION_PARSE_FAILED when no parseable URL found", async () => {
    const service = makeService();
    const result = await service.acquire({
      method: "smart-paste",
      rawText: "Software Engineer at Acme Corp — remote, build great things with us. " +
        "We need node.js and typescript skills. Apply now by sending your resume to careers@acme.com."
    });
    // No URL in text and no sourceUrl → should fail to parse a safe public URL
    assert.equal(result.ok, false);
  });

  it("ingests when rawText and sourceUrl are valid", async () => {
    const service = makeService();
    const result = await service.acquire({
      method: "smart-paste",
      rawText: "Software Engineer at Acme Corp\nEmpresa: Acme Corp\n" +
        "URL: https://acme.com/jobs/123\n" +
        "We are looking for a node.js and typescript developer to join our team. " +
        "You will build scalable APIs and contribute to a growing product.",
      sourceUrl: "https://acme.com/jobs/123"
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.evidence.method, "smart-paste");
      assert.ok(result.data.input.description.length > 0);
    }
  });
});

describe("JobAcquisitionService.acquire — email-alert", () => {
  it("ingests job from email alert text with embedded URL", async () => {
    const service = makeService();
    const emailText = [
      "New job alert from LinkedIn",
      "Vaga: Senior Frontend Developer",
      "Empresa: TechCorp",
      "Location: Remote",
      "https://linkedin.com/jobs/view/9876543",
      "We are looking for a senior frontend developer with react, typescript and next.js experience.",
      "This is a fully remote position with competitive compensation."
    ].join("\n");

    const result = await service.acquire({ method: "email-alert", rawText: emailText });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.evidence.method, "email-alert");
      assert.equal(result.data.evidence.parser, "text-heuristic");
    }
  });
});

describe("JobAcquisitionService.acquire — provider-json", () => {
  it("ingests from structured JobPosting JSON-LD payload", async () => {
    const service = makeService();
    const payload = {
      "@type": "JobPosting",
      "title": "Backend Engineer",
      "hiringOrganization": { "name": "RocketCorp" },
      "description": "We are hiring a backend engineer with strong node.js, postgresql and docker skills.",
      "url": "https://rocketcorp.com/careers/backend",
      "jobLocation": { "addressLocality": "Remote" },
      "datePosted": "2026-04-20"
    };

    const result = await service.acquire({ method: "provider-json", providerPayload: payload });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.input.title, "Backend Engineer");
      assert.equal(result.data.input.companyName, "RocketCorp");
      assert.equal(result.data.evidence.parser, "structured-json");
      assert.equal(result.data.evidence.confidence, "high");
    }
  });

  it("returns ACQUISITION_PARSE_FAILED for provider JSON missing required fields", async () => {
    const service = makeService();
    const result = await service.acquire({
      method: "provider-json",
      providerPayload: { "@type": "JobPosting", "title": "Engineer" }
      // missing description, url, companyName
    });
    assert.equal(result.ok, false);
  });
});

describe("JobAcquisitionService.acquire — browser-capture", () => {
  it("extracts from JSON-LD in captured HTML", async () => {
    const service = makeService();
    const html = `<html><head>
      <script type="application/ld+json">
        {"@type":"JobPosting","title":"DevOps Lead","hiringOrganization":{"name":"CloudBase"},
         "description":"We need a devops engineer with kubernetes, terraform and aws skills to lead our infra team.",
         "url":"https://cloudbase.io/jobs/devops-lead"}
      </script>
    </head><body><p>Apply today</p></body></html>`;

    const result = await service.acquire({
      method: "browser-capture",
      html,
      sourceUrl: "https://cloudbase.io/jobs/devops-lead"
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.data.input.title, "DevOps Lead");
      assert.equal(result.data.evidence.parser, "structured-json");
    }
  });
});

describe("JobAcquisitionService.acquire — url-import platform adapters", () => {
  it("extracts Indeed job page with canonical sourceName", async () => {
    const service = makeService();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: string | URL | globalThis.Request): Promise<Response> => {
      const url = String(input);
      if (!url.includes("indeed.com")) throw new Error(`unexpected URL in test: ${url}`);
      return new Response(
        `
          <html><body>
            <h1 class="jobsearch-JobInfoHeader-title">Backend Developer</h1>
            <div class="jobsearch-CompanyInfoContainer"><a href="#">Indeed Inc</a></div>
            <div class="jobsearch-JobInfoHeader-subtitle"><div>Austin, TX</div></div>
            <div id="jobDescriptionText">Build backend services.</div>
          </body></html>
        `,
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
      );
    };

    try {
      const result = await service.acquire({
        method: "url-import",
        sourceUrl: "https://www.indeed.com/viewjob?jk=123"
      });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.data.input.sourceName, "Indeed");
        assert.equal(result.data.evidence.sourceName, "Indeed");
        assert.equal(result.data.evidence.parser, "indeed-ats-adapter");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("extracts Solides job page with canonical sourceName", async () => {
    const service = makeService();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input: string | URL | globalThis.Request): Promise<Response> => {
      const url = String(input);
      if (!url.includes("solides.jobs")) throw new Error(`unexpected URL in test: ${url}`);
      return new Response(
        `
          <html><body>
            <h2 class="vacancy-title">Desenvolvedor Backend</h2>
            <span class="vacancy-location">Belo Horizonte, MG</span>
            <div class="vacancy-description">Vaga para atuar em squad ágil.</div>
          </body></html>
        `,
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } }
      );
    };

    try {
      const result = await service.acquire({
        method: "url-import",
        sourceUrl: "https://empresa.solides.jobs/vacancies/999"
      });
      assert.equal(result.ok, true);
      if (result.ok) {
        assert.equal(result.data.input.sourceName, "Solides");
        assert.equal(result.data.evidence.sourceName, "Solides");
        assert.equal(result.data.evidence.parser, "solides-ats-adapter");
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("JobAcquisitionService.acquire — deduplication", () => {
  it("deduplicates when same job is acquired twice", async () => {
    const service = makeService();
    const payload = {
      method: "smart-paste" as const,
      rawText: "Senior Node.js Engineer at Acme Corp\nEmpresa: Acme Corp\n" +
        "URL: https://acme.com/jobs/456\n" +
        "Build scalable backend systems with node.js, typescript and postgresql.",
      sourceUrl: "https://acme.com/jobs/456"
    };

    const first = await service.acquire(payload);
    const second = await service.acquire(payload);

    assert.equal(first.ok, true);
    assert.equal(second.ok, true);
    if (first.ok && second.ok) {
      assert.equal(first.data.ingestion.deduplicated, false);
      assert.equal(second.data.ingestion.deduplicated, true);
    }
  });
});

// ── ATS Adapters ──────────────────────────────────────────────────────────────

import {
  extractGupyJob,
  extractSolidesJob,
  extractLinkedInJob,
  extractIndeedJob,
  extractGlassdoorJob,
  extractInfojobsJob,
  extractCathoJob,
  extractTrabalhaBrasilJob
} from "./ats-adapters.js";

describe("ATS Adapters — extractGupyJob", () => {
  it("extracts from Gupy HTML using regex fallbacks", () => {
    const html = `
      <html>
        <head>
          <title>Trabalhe na TechMinds - Gupy</title>
        </head>
        <body>
          <h1 data-testid="job-title">Especialista em TypeScript</h1>
          <span data-testid="job-location">São Paulo, SP - Híbrido</span>
          <div data-testid="job-description">
            Buscamos um dev senior para liderar a stack Node.js.
          </div>
        </body>
      </html>
    `;
    const url = new URL("https://techminds.gupy.io/jobs/12345");
    const result = extractGupyJob(html, url, "ats-adapter");
    
    assert.ok(result);
    assert.equal(result.input.title, "Especialista em TypeScript");
    assert.equal(result.input.companyName, "TechMinds");
    assert.equal(result.input.location, "São Paulo, SP - Híbrido");
    assert.equal(result.input.description, "Buscamos um dev senior para liderar a stack Node.js.");
    assert.equal(result.evidence.parser, "gupy-ats-adapter");
  });

  it("returns undefined for non-Gupy URL", () => {
    const html = `<h1 data-testid="job-title">Vaga</h1><div data-testid="job-description">Desc</div>`;
    const url = new URL("https://example.com");
    const result = extractGupyJob(html, url, "ats-adapter");
    assert.equal(result, undefined);
  });

  it("does not match attacker-controlled suffix hosts", () => {
    const html = `<h1 data-testid="job-title">Vaga</h1><div data-testid="job-description">Desc</div>`;
    const url = new URL("https://gupy.io.attacker.example/jobs/12345");
    const result = extractGupyJob(html, url, "ats-adapter");
    assert.equal(result, undefined);
  });
});

describe("ATS Adapters — extractSolidesJob", () => {
  it("extracts from Solides HTML using regex fallbacks", () => {
    const html = `
      <html>
        <head>
          <title>Vaga na Inovação LTDA - Sólides</title>
        </head>
        <body>
          <h2 class="vacancy-title">Desenvolvedor Backend (Remoto)</h2>
          <span class="vacancy-location">Belo Horizonte, MG</span>
          <div class="vacancy-description">
            Vaga para atuar em squad ágil com foco em microsserviços.
          </div>
        </body>
      </html>
    `;
    const url = new URL("https://inovacao.solides.jobs/vacancies/999");
    const result = extractSolidesJob(html, url, "ats-adapter");
    
    assert.ok(result);
    assert.equal(result.input.title, "Desenvolvedor Backend (Remoto)");
    assert.equal(result.input.companyName, "Inovação LTDA");
    assert.equal(result.input.location, "Belo Horizonte, MG");
    assert.equal(result.input.description, "Vaga para atuar em squad ágil com foco em microsserviços.");
    assert.equal(result.evidence.parser, "solides-ats-adapter");
  });

  it("returns undefined for non-Solides URL", () => {
    const html = `<h2 class="vacancy-title">Vaga</h2><div class="vacancy-description">Desc</div>`;
    const url = new URL("https://example.com");
    const result = extractSolidesJob(html, url, "ats-adapter");
    assert.equal(result, undefined);
  });
});

describe("ATS Adapters — extractLinkedInJob", () => {
  it("extracts from LinkedIn HTML", () => {
    const html = `
      <html>
        <body>
          <h1 class="top-card-layout__title">Software Engineer</h1>
          <a href="/company/linkedin-company">LinkedIn Corp</a>
          <span class="topcard__flavor--bullet">San Francisco, CA</span>
          <div class="show-more-less-html__markup">Looking for a great engineer!</div>
        </body>
      </html>
    `;
    const url = new URL("https://www.linkedin.com/jobs/view/12345");
    const result = extractLinkedInJob(html, url, "ats-adapter");
    
    assert.ok(result);
    assert.equal(result.input.title, "Software Engineer");
    assert.equal(result.input.companyName, "LinkedIn Corp");
    assert.equal(result.input.location, "San Francisco, CA");
    assert.equal(result.input.description, "Looking for a great engineer!");
  });
});

describe("ATS Adapters — extractIndeedJob", () => {
  it("extracts from Indeed HTML", () => {
    const html = `
      <html>
        <body>
          <h1 class="jobsearch-JobInfoHeader-title">Backend Developer</h1>
          <div class="jobsearch-CompanyInfoContainer"><a href="#">Indeed Inc</a></div>
          <div class="jobsearch-JobInfoHeader-subtitle"><div>Austin, TX</div></div>
          <div id="jobDescriptionText">Build backend services.</div>
        </body>
      </html>
    `;
    const url = new URL("https://www.indeed.com/viewjob?jk=123");
    const result = extractIndeedJob(html, url, "ats-adapter");
    
    assert.ok(result);
    assert.equal(result.input.title, "Backend Developer");
    assert.equal(result.input.companyName, "Indeed Inc");
    assert.equal(result.input.location, "Austin, TX");
    assert.equal(result.input.description, "Build backend services.");
  });
});

describe("ATS Adapters — extractGlassdoorJob", () => {
  it("extracts from Glassdoor HTML", () => {
    const html = `
      <html>
        <body>
          <div class="JobDetails_jobTitle__abc">Fullstack Dev</div>
          <div class="EmployerProfile_employerName__xyz">Glassdoor LLC<span class="rating">4.5</span></div>
          <div class="JobDetails_location__123">Remote</div>
          <div id="JobDescriptionContainer">Great benefits and remote work.</div>
        </body>
      </html>
    `;
    const url = new URL("https://www.glassdoor.com/job-listing/123");
    const result = extractGlassdoorJob(html, url, "ats-adapter");
    
    assert.ok(result);
    assert.equal(result.input.title, "Fullstack Dev");
    assert.equal(result.input.companyName, "Glassdoor LLC");
    assert.equal(result.input.location, "Remote");
    assert.equal(result.input.description, "Great benefits and remote work.");
  });
});

describe("ATS Adapters — extractInfojobsJob", () => {
  it("extracts from Infojobs HTML", () => {
    const html = `
      <html>
        <body>
          <h2 class="js_vacancyTitle">Engenheiro de Dados</h2>
          <div class="js_vacancyCompany"><a href="#">Infojobs SA</a></div>
          <div class="js_vacancyLocation">São Paulo, SP</div>
          <div id="js_vacancyDescription">Análise de dados com Python.</div>
        </body>
      </html>
    `;
    const url = new URL("https://www.infojobs.com.br/vaga/123");
    const result = extractInfojobsJob(html, url, "ats-adapter");
    
    assert.ok(result);
    assert.equal(result.input.title, "Engenheiro de Dados");
    assert.equal(result.input.companyName, "Infojobs SA");
    assert.equal(result.input.location, "São Paulo, SP");
    assert.equal(result.input.description, "Análise de dados com Python.");
  });
});

describe("ATS Adapters — extractCathoJob", () => {
  it("extracts from Catho HTML", () => {
    const html = `
      <html>
        <body>
          <h1>Analista de Sistemas</h1>
          <div class="job-company-name">Catho Corp</div>
          <span class="job-location">Barueri, SP</span>
          <div class="job-description">Trabalhar com Java e Spring.</div>
        </body>
      </html>
    `;
    const url = new URL("https://www.catho.com.br/vagas/123");
    const result = extractCathoJob(html, url, "ats-adapter");
    
    assert.ok(result);
    assert.equal(result.input.title, "Analista de Sistemas");
    assert.equal(result.input.companyName, "Catho Corp");
    assert.equal(result.input.location, "Barueri, SP");
    assert.equal(result.input.description, "Trabalhar com Java e Spring.");
  });
});

describe("ATS Adapters — extractTrabalhaBrasilJob", () => {
  it("extracts from Trabalha Brasil HTML", () => {
    const html = `
      <html>
        <body>
          <h1 class="job-title">Programador Junior</h1>
          <p class="job-company">Tech Brasil LTDA</p>
          <span class="job-location">Curitiba, PR</span>
          <div class="job-desc">Programação em C# e .NET.</div>
        </body>
      </html>
    `;
    const url = new URL("https://www.trabalhabrasil.com.br/vagas/123");
    const result = extractTrabalhaBrasilJob(html, url, "ats-adapter");
    
    assert.ok(result);
    assert.equal(result.input.title, "Programador Junior");
    assert.equal(result.input.companyName, "Tech Brasil LTDA");
    assert.equal(result.input.location, "Curitiba, PR");
    assert.equal(result.input.description, "Programação em C# e .NET.");
  });
});
