import type { JobPostingLLMEnrichment, JobSeniority, JobWorkModel } from "@olympus/shared-types";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 8000;

interface AnalyzeJobPostingOptions {
  timeoutMs?: number;
  model?: string;
  now?: () => Date;
  generateText?: (prompt: string) => Promise<string>;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function normalizeSkill(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueSkills(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of values) {
    const normalized = normalizeSkill(raw);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }
  return out;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  const safeTimeout = clamp(Math.floor(timeoutMs), 1000, 30000);
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${safeTimeout}ms`));
    }, safeTimeout);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function detectWorkModel(text: string): JobWorkModel {
  const lower = text.toLowerCase();
  if (/\b(hybrid|hibrid|híbrido)\b/.test(lower)) return "hybrid";
  if (/\b(on[-\s]?site|presencial)\b/.test(lower)) return "on-site";
  if (/\b(remote|remoto|remota|home office)\b/.test(lower)) return "remote";
  return "unknown";
}

function detectLanguage(text: string): string {
  const lower = text.toLowerCase();
  const ptHits = (lower.match(/\b(vaga|requisitos|experiencia|desenvolvedor|pleno|senior|remoto)\b/g) ?? []).length;
  const enHits = (lower.match(/\b(requirements|experience|engineer|developer|remote|senior)\b/g) ?? []).length;
  if (ptHits === 0 && enHits === 0) return "unknown";
  return ptHits >= enHits ? "pt-BR" : "en";
}

function detectSeniority(text: string): JobSeniority {
  const lower = text.toLowerCase();
  if (/\b(lead|principal|staff|architect|arquiteto|coordenador|manager)\b/.test(lower)) return "lead";
  if (/\b(senior|sênior|sr|especialista|specialist)\b/.test(lower)) return "senior";
  if (/\b(junior|jr|trainee|intern|estagio|estágio|estagiario|estagiário)\b/.test(lower)) return "junior";
  return "mid";
}

const SKILL_HINTS = [
  "node", "node.js", "typescript", "javascript", "react", "react.js", "next.js", "postgresql", "postgres",
  "mysql", "mongodb", "redis", "aws", "gcp", "azure", "docker", "kubernetes", "graphql", "rest",
  "python", "java", "golang", "c#", "dotnet", "php", "laravel", "nestjs", "express", "tailwind"
];

function extractFallbackSkills(text: string): string[] {
  const normalized = normalizeSkill(text);
  const matched: string[] = [];
  for (const skill of SKILL_HINTS) {
    const token = normalizeSkill(skill);
    if (!token) continue;
    if (normalized.includes(token)) {
      matched.push(token);
    }
  }
  return uniqueSkills(matched);
}

function buildFallbackEnrichment(jobTitle: string, jobDescription: string, reason: string, now = new Date()): JobPostingLLMEnrichment {
  const source = `${jobTitle} ${jobDescription}`;
  const skills = extractFallbackSkills(source);
  const confidence = clamp(0.25 + Math.min(0.45, skills.length * 0.05), 0.2, 0.7);

  return {
    normalizedSkills: skills,
    seniority: detectSeniority(source),
    language: detectLanguage(source),
    workModel: detectWorkModel(source),
    confidence,
    signals: [`fallback:${reason}`],
    provider: "fallback",
    latencyMs: 0,
    generatedAt: now.toISOString()
  };
}

function parseStructuredEnrichment(raw: unknown, now: Date, latencyMs: number): JobPostingLLMEnrichment {
  const obj = (raw ?? {}) as Record<string, unknown>;
  const normalizedSkills = Array.isArray(obj["normalizedSkills"])
    ? uniqueSkills(obj["normalizedSkills"].filter((item): item is string => typeof item === "string"))
    : [];

  const seniorityRaw = typeof obj["seniority"] === "string" ? obj["seniority"].toLowerCase() : "mid";
  const seniority: JobSeniority =
    seniorityRaw === "junior" || seniorityRaw === "mid" || seniorityRaw === "senior" || seniorityRaw === "lead"
      ? seniorityRaw
      : "mid";

  const workModelRaw = typeof obj["workModel"] === "string" ? obj["workModel"].toLowerCase() : "unknown";
  const workModel: JobWorkModel =
    workModelRaw === "remote" || workModelRaw === "hybrid" || workModelRaw === "on-site" || workModelRaw === "unknown"
      ? workModelRaw
      : "unknown";

  const language = typeof obj["language"] === "string" ? obj["language"].trim() || "unknown" : "unknown";
  const confidenceRaw = typeof obj["confidence"] === "number" ? obj["confidence"] : 0.5;
  const signals = Array.isArray(obj["signals"])
    ? obj["signals"].filter((item): item is string => typeof item === "string").map((item) => item.slice(0, 180))
    : [];

  return {
    normalizedSkills,
    seniority,
    language,
    workModel,
    confidence: clamp(Number.isFinite(confidenceRaw) ? confidenceRaw : 0.5, 0, 1),
    signals,
    provider: "gemini",
    latencyMs,
    generatedAt: now.toISOString()
  };
}

function buildJobEnrichmentPrompt(jobTitle: string, jobDescription: string): string {
  return `
Você é um analisador técnico de vagas de tecnologia.
Retorne apenas JSON válido (sem markdown), com as chaves exatas:
{
  "normalizedSkills": string[],
  "seniority": "junior" | "mid" | "senior" | "lead",
  "language": string,
  "workModel": "remote" | "hybrid" | "on-site" | "unknown",
  "confidence": number,
  "signals": string[]
}

Regras:
- normalizedSkills: termos técnicos normalizados e curtos (ex: node, react, typescript, postgresql).
- confidence: 0 a 1.
- signals: sinais objetivos (max 8 itens).
- Não incluir texto fora do JSON.

VAGA:
Título: ${jobTitle}
Descrição: ${jobDescription}
`;
}

function createGeminiTextGenerator(apiKey: string, modelName: string): (prompt: string) => Promise<string> {
  return async (prompt: string) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    return result.response.text() || "";
  };
}

export async function extractSkillsWithGemini(cvText: string): Promise<string[]> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const modelName = DEFAULT_GEMINI_MODEL;
  const generateText = createGeminiTextGenerator(apiKey, modelName);
  const prompt = `
Você é um especialista em recrutamento técnico de TI.
O texto abaixo é um currículo (CV).
Extraia TODAS as tecnologias, linguagens, frameworks, bibliotecas, metodologias, bancos de dados, ferramentas e plataformas de nuvem mencionadas.
Não crie skills novas, apenas extraia exatamente as que estão no texto.
Liste as skills separadas por vírgula. Apenas a lista, sem texto adicional.

Currículo:
"""
${cvText}
"""
`;

  const text = await withTimeout(generateText(prompt), DEFAULT_TIMEOUT_MS, "extractSkillsWithGemini");
  return text.split(",").map((s) => normalizeSkill(s)).filter((s) => s.length > 0);
}

export async function analyzeJobPostingWithLLM(
  jobTitle: string,
  jobDescription: string,
  options?: AnalyzeJobPostingOptions
): Promise<JobPostingLLMEnrichment> {
  const startedAt = Date.now();
  const now = options?.now?.() ?? new Date();
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const modelName = options?.model ?? DEFAULT_GEMINI_MODEL;
  const apiKey = process.env["GEMINI_API_KEY"];

  if (!apiKey && !options?.generateText) {
    return buildFallbackEnrichment(jobTitle, jobDescription, "missing-api-key", now);
  }

  const generateText = options?.generateText ?? createGeminiTextGenerator(apiKey as string, modelName);
  const prompt = buildJobEnrichmentPrompt(jobTitle, jobDescription);

  try {
    const rawText = await withTimeout(generateText(prompt), timeoutMs, "analyzeJobPostingWithLLM");
    const jsonText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(jsonText) as unknown;
    const latencyMs = Date.now() - startedAt;
    return parseStructuredEnrichment(parsed, now, latencyMs);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return buildFallbackEnrichment(jobTitle, jobDescription, reason, now);
  }
}

export async function analyzeJobMatch(
  profileHeadline: string,
  profileSkills: string[],
  jobTitle: string,
  jobDescription: string
): Promise<{ score: number; rationale: string }> {
  const apiKey = process.env["GEMINI_API_KEY"];
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not found in environment variables");
  }

  const modelName = DEFAULT_GEMINI_MODEL;
  const generateText = createGeminiTextGenerator(apiKey, modelName);
  const prompt = `
Você é um recrutador técnico sênior avaliando um candidato para uma vaga.

CANDIDATO:
Título: ${profileHeadline}
Skills: ${profileSkills.join(", ")}

VAGA:
Título: ${jobTitle}
Descrição: ${jobDescription}

Analise a aderência deste candidato a esta vaga.
Retorne um JSON estrito (sem formatação markdown \`\`\`json) contendo exatamente as seguintes chaves:
{
  "score": numero_de_0_a_100,
  "rationale": "Uma frase curta explicando a pontuação e os pontos mais fortes/fracos de aderência"
}
`;

  try {
    const text = await withTimeout(generateText(prompt), DEFAULT_TIMEOUT_MS, "analyzeJobMatch");
    const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(clean) as Record<string, unknown>;
    return {
      score: typeof parsed.score === "number" ? parsed.score : 0,
      rationale: typeof parsed.rationale === "string" ? parsed.rationale : "Sem justificativa."
    };
  } catch {
    return { score: 0, rationale: "Erro ao consultar a IA para avaliação profunda." };
  }
}

export const GEMINI_INTERNALS = {
  normalizeSkill,
  buildFallbackEnrichment,
  parseStructuredEnrichment,
  detectLanguage,
  detectWorkModel,
  detectSeniority,
  extractFallbackSkills
};
