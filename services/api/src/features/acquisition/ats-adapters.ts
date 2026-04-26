import type { IngestJobPostingInput, JobAcquisitionEvidence, JobAcquisitionMethod } from "@olympus/shared-types";

// Auxiliares para extração

function cleanHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function hostMatches(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === domain || host.endsWith(`.${domain}`);
}

function extractByRegex(html: string, regex: RegExp): string {
  const match = html.match(regex);
  return match && match[1] ? cleanHtmlText(match[1]) : "";
}

function extractByStructuredData(html: string, key: string): string {
  // Gupy, por exemplo, injeta JSON config no source code
  const regex = new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`);
  const match = html.match(regex);
  return match && match[1] ? cleanHtmlText(match[1]) : "";
}

export function extractGupyJob(
  html: string,
  url: URL,
  method: JobAcquisitionMethod
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  if (!hostMatches(url.hostname, "gupy.io")) return undefined;

  // Gupy usa <h1> ou um h1 com class/data-testid específico para título
  const title = extractByRegex(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) || extractByStructuredData(html, "jobTitle");
  
  // Empresa geralmente está no title da página ou metadados: "Vaga X na Empresa Y" ou "Trabalhe na Empresa Y"
  let companyName = extractByRegex(html, /<title[^>]*>.*?(?:na|em|-|\|)\s*(.*?)(?:\s*-\s*Gupy)?<\/title>/i);
  if (!companyName || companyName.toLowerCase().includes("vaga")) {
    // Tenta inferir da URL se não bater no title
    companyName = url.hostname.split(".")[0];
    companyName = companyName ? companyName.charAt(0).toUpperCase() + companyName.slice(1) : "Empresa Desconhecida";
  }

  // Location na Gupy costuma vir numa div ou span com icon de map-pin, mas podemos capturar da meta
  const location = extractByRegex(html, /<span[^>]*data-testid="job-location"[^>]*>([\s\S]*?)<\/span>/i) || "Remoto/Não Especificado";
  
  // Descrição
  const description = extractByRegex(html, /<div[^>]*data-testid="job-description"[^>]*>([\s\S]*?)<\/div>/i) ||
                      extractByRegex(html, /<section[^>]*class="description"[^>]*>([\s\S]*?)<\/section>/i) ||
                      extractByRegex(html, /<main[^>]*>([\s\S]*?)<\/main>/i); // Fallback mais amplo

  if (!title || !description) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: "Gupy",
      sourceUrl: url.toString(),
      location: location.slice(0, 200),
      description: description.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: "Gupy",
      sourceUrl: url.toString(),
      parser: "gupy-ats-adapter",
      confidence: "high",
      notes: ["Parsed via specific Gupy HTML selectors"]
    }
  };
}

export function extractSolidesJob(
  html: string,
  url: URL,
  method: JobAcquisitionMethod
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  if (!hostMatches(url.hostname, "solides.jobs") && !hostMatches(url.hostname, "solides.com")) return undefined;

  // Sólides usa <h2> com class vacancy-title, ou similar
  const title = extractByRegex(html, /<h[12][^>]*class="[^"]*vacancy-title[^"]*"[^>]*>([\s\S]*?)<\/h[12]>/i) ||
                extractByRegex(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  // Empresa costuma vir no title ou header
  let companyName = extractByRegex(html, /<title[^>]*>.*?(?:na|em|-|\|)\s*(.*?)(?:\s*-\s*Sólides)?<\/title>/i);
  if (!companyName) {
    companyName = url.hostname.split(".")[0];
    companyName = companyName ? companyName.charAt(0).toUpperCase() + companyName.slice(1) : "Empresa Desconhecida";
  }

  // Location na Sólides
  const location = extractByRegex(html, /<span[^>]*class="[^"]*vacancy-location[^"]*"[^>]*>([\s\S]*?)<\/span>/i) || "Remoto/Não Especificado";

  // Descrição
  const description = extractByRegex(html, /<div[^>]*class="[^"]*vacancy-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      extractByRegex(html, /<main[^>]*>([\s\S]*?)<\/main>/i); // Fallback

  if (!title || !description) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: "Sólides",
      sourceUrl: url.toString(),
      location: location.slice(0, 200),
      description: description.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: "Sólides",
      sourceUrl: url.toString(),
      parser: "solides-ats-adapter",
      confidence: "high",
      notes: ["Parsed via specific Sólides HTML selectors"]
    }
  };
}

export function extractLinkedInJob(
  html: string,
  url: URL,
  method: JobAcquisitionMethod
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  if (!hostMatches(url.hostname, "linkedin.com")) return undefined;

  const title = extractByRegex(html, /<h1[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                extractByRegex(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  const companyName = extractByRegex(html, /<a[^>]*href="[^"]*\/company\/[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
                      extractByRegex(html, /<span[^>]*class="[^"]*topcard__flavor[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                      "LinkedIn Company";

  const location = extractByRegex(html, /<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                   "Remoto/Não Especificado";

  const description = extractByRegex(html, /<div[^>]*class="[^"]*show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      extractByRegex(html, /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (!title || !description) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: "LinkedIn",
      sourceUrl: url.toString(),
      location: location.slice(0, 200),
      description: description.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: "LinkedIn",
      sourceUrl: url.toString(),
      parser: "linkedin-ats-adapter",
      confidence: "high",
      notes: ["Parsed via LinkedIn HTML selectors"]
    }
  };
}

export function extractIndeedJob(
  html: string,
  url: URL,
  method: JobAcquisitionMethod
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  if (!hostMatches(url.hostname, "indeed.com")) return undefined;

  const title = extractByRegex(html, /<h1[^>]*class="[^"]*jobsearch-JobInfoHeader-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                extractByRegex(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  const companyName = extractByRegex(html, /<div[^>]*class="[^"]*jobsearch-CompanyInfoContainer[^"]*"[^>]*>.*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
                      extractByRegex(html, /<div[^>]*data-company-name="true"[^>]*>([\s\S]*?)<\/div>/i) ||
                      "Indeed Company";

  const location = extractByRegex(html, /<div[^>]*class="[^"]*jobsearch-JobInfoHeader-subtitle[^"]*"[^>]*>.*?<div[^>]*>([\s\S]*?)<\/div>/i) ||
                   "Remoto/Não Especificado";

  const description = extractByRegex(html, /<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i);

  if (!title || !description) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: "Indeed",
      sourceUrl: url.toString(),
      location: location.slice(0, 200),
      description: description.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: "Indeed",
      sourceUrl: url.toString(),
      parser: "indeed-ats-adapter",
      confidence: "high",
      notes: ["Parsed via Indeed HTML selectors"]
    }
  };
}

export function extractGlassdoorJob(
  html: string,
  url: URL,
  method: JobAcquisitionMethod
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  if (!hostMatches(url.hostname, "glassdoor.com")) return undefined;

  const title = extractByRegex(html, /<div[^>]*class="[^"]*JobDetails_jobTitle[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                extractByRegex(html, /<div[^>]*data-test="job-title"[^>]*>([\s\S]*?)<\/div>/i);

  const companyName = extractByRegex(html, /<div[^>]*class="[^"]*EmployerProfile_employerName[^"]*"[^>]*>([\s\S]*?)<span/i) ||
                      extractByRegex(html, /<div[^>]*data-test="employer-name"[^>]*>([\s\S]*?)<\/div>/i) ||
                      "Glassdoor Company";

  const location = extractByRegex(html, /<div[^>]*class="[^"]*JobDetails_location[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                   "Remoto/Não Especificado";

  const description = extractByRegex(html, /<div[^>]*id="JobDescriptionContainer"[^>]*>([\s\S]*?)<\/div>/i) ||
                      extractByRegex(html, /<div[^>]*class="[^"]*JobDetails_jobDescription[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (!title || !description) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: "Glassdoor",
      sourceUrl: url.toString(),
      location: location.slice(0, 200),
      description: description.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: "Glassdoor",
      sourceUrl: url.toString(),
      parser: "glassdoor-ats-adapter",
      confidence: "high",
      notes: ["Parsed via Glassdoor HTML selectors"]
    }
  };
}

export function extractInfojobsJob(
  html: string,
  url: URL,
  method: JobAcquisitionMethod
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  if (!hostMatches(url.hostname, "infojobs.com.br")) return undefined;

  const title = extractByRegex(html, /<h2[^>]*class="[^"]*js_vacancyTitle[^"]*"[^>]*>([\s\S]*?)<\/h2>/i) ||
                extractByRegex(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  const companyName = extractByRegex(html, /<div[^>]*class="[^"]*js_vacancyCompany[^"]*"[^>]*>.*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
                      "Infojobs Company";

  const location = extractByRegex(html, /<div[^>]*class="[^"]*js_vacancyLocation[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                   "Remoto/Não Especificado";

  const description = extractByRegex(html, /<div[^>]*id="js_vacancyDescription"[^>]*>([\s\S]*?)<\/div>/i);

  if (!title || !description) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: "Infojobs",
      sourceUrl: url.toString(),
      location: location.slice(0, 200),
      description: description.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: "Infojobs",
      sourceUrl: url.toString(),
      parser: "infojobs-ats-adapter",
      confidence: "high",
      notes: ["Parsed via Infojobs HTML selectors"]
    }
  };
}

export function extractCathoJob(
  html: string,
  url: URL,
  method: JobAcquisitionMethod
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  if (!hostMatches(url.hostname, "catho.com.br")) return undefined;

  const title = extractByRegex(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
                extractByRegex(html, /<h2[^>]*class="[^"]*job-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i);

  const companyName = extractByRegex(html, /<div[^>]*class="[^"]*job-company-name[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
                      "Catho Company";

  const location = extractByRegex(html, /<span[^>]*class="[^"]*job-location[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                   "Remoto/Não Especificado";

  const description = extractByRegex(html, /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (!title || !description) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: "Catho",
      sourceUrl: url.toString(),
      location: location.slice(0, 200),
      description: description.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: "Catho",
      sourceUrl: url.toString(),
      parser: "catho-ats-adapter",
      confidence: "high",
      notes: ["Parsed via Catho HTML selectors"]
    }
  };
}

export function extractTrabalhaBrasilJob(
  html: string,
  url: URL,
  method: JobAcquisitionMethod
): { input: IngestJobPostingInput; evidence: JobAcquisitionEvidence } | undefined {
  if (!hostMatches(url.hostname, "trabalhabrasil.com.br")) return undefined;

  const title = extractByRegex(html, /<h1[^>]*class="[^"]*job-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
                extractByRegex(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i);

  const companyName = extractByRegex(html, /<p[^>]*class="[^"]*job-company[^"]*"[^>]*>([\s\S]*?)<\/p>/i) ||
                      "Trabalha Brasil Company";

  const location = extractByRegex(html, /<span[^>]*class="[^"]*job-location[^"]*"[^>]*>([\s\S]*?)<\/span>/i) ||
                   "Remoto/Não Especificado";

  const description = extractByRegex(html, /<div[^>]*class="[^"]*job-desc[^"]*"[^>]*>([\s\S]*?)<\/div>/i);

  if (!title || !description) return undefined;

  return {
    input: {
      title: title.slice(0, 240),
      companyName: companyName.slice(0, 200),
      sourceName: "Trabalha Brasil",
      sourceUrl: url.toString(),
      location: location.slice(0, 200),
      description: description.slice(0, 10_000)
    },
    evidence: {
      method,
      sourceName: "Trabalha Brasil",
      sourceUrl: url.toString(),
      parser: "trabalhabrasil-ats-adapter",
      confidence: "high",
      notes: ["Parsed via Trabalha Brasil HTML selectors"]
    }
  };
}
