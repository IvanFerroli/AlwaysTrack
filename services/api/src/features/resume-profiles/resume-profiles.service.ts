import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type {
  ApiResult,
  ListPayload,
  MainCvAnalyzeInput,
  MainCvAnalyzeResult,
  MainCvSource,
  ResumeProfile,
  ResumeProfileCreateInput
} from "@olympus/shared-types";
import { InMemoryStateStore } from "../../domain/state/store.js";

function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

function fail(code: string, message: string): ApiResult<never> {
  return { ok: false, error: { code, message } };
}

function normalizeSkills(skills: string[]): string[] {
  return [...new Set(skills.map((item) => item.trim().toLowerCase()).filter((item) => item.length > 0))];
}

const STACK_LINE_PREFIXES = [
  "linguagens:",
  "languages:",
  "front-end:",
  "back-end:",
  "banco de dados:",
  "database:",
  "infraestrutura & devops:",
  "infrastructure & devops:",
  "testing & qa:",
  "testes & qa:",
  "other:",
  "outros:",
  "ai applied to software development:",
  "ia aplicada ao desenvolvimento:"
];

function normalizePrefix(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function cleanupSkill(raw: string): string {
  return raw
    .replace(/\(.*?\)/g, "")
    .replace(/\s+/g, " ")
    .replace(/^[-*\u2022]+/, "")
    .trim();
}

function extractSkillsFromCvText(text: string): string[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter((line) => line.length > 0);
  const extracted: string[] = [];

  for (const line of lines) {
    const normalizedLine = normalizePrefix(line);
    const prefix = STACK_LINE_PREFIXES.find((item) => normalizedLine.startsWith(normalizePrefix(item)));
    if (!prefix) {
      continue;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex < 0) {
      continue;
    }
    const values = line.slice(separatorIndex + 1);
    const chunks = values.split(/[,;|]/g);
    for (const chunk of chunks) {
      const cleaned = cleanupSkill(chunk);
      if (cleaned.length >= 2) {
        extracted.push(cleaned);
      }
    }
  }

  return normalizeSkills(extracted);
}

interface ResumeProfilesServiceOptions {
  cvSourcesDir?: string;
}

export class ResumeProfilesService {
  private readonly cvSourcesDir: string;

  constructor(
    private readonly store: InMemoryStateStore,
    options: ResumeProfilesServiceOptions = {}
  ) {
    this.cvSourcesDir = options.cvSourcesDir ?? path.resolve(process.cwd(), "doc");
  }

  list(): ApiResult<ListPayload<ResumeProfile>> {
    return ok({ items: this.store.listResumeProfiles() });
  }

  create(payload: ResumeProfileCreateInput): ApiResult<ResumeProfile> {
    const profile = this.store.createResumeProfile({
      headline: payload.headline.trim(),
      skills: normalizeSkills(payload.skills)
    });
    return ok(profile);
  }

  getById(id: string): ApiResult<ResumeProfile> {
    const profile = this.store.findResumeProfileById(id);
    if (!profile) {
      return fail("RESUME_PROFILE_NOT_FOUND", `Resume profile ${id} not found`);
    }
    return ok(profile);
  }

  update(id: string, payload: Partial<Pick<ResumeProfile, "headline" | "skills">>): ApiResult<ResumeProfile> {
    const profile = this.store.updateResumeProfile(id, {
      headline: payload.headline?.trim(),
      skills: payload.skills ? normalizeSkills(payload.skills) : undefined
    });
    if (!profile) {
      return fail("RESUME_PROFILE_NOT_FOUND", `Resume profile ${id} not found`);
    }
    return ok(profile);
  }

  failValidation(): ApiResult<never> {
    return fail("INVALID_RESUME_PROFILE_PAYLOAD", "Payload must include headline and skills[]");
  }

  async listMainCvSources(): Promise<ApiResult<ListPayload<MainCvSource>>> {
    try {
      const entries = await readdir(this.cvSourcesDir, { withFileTypes: true });
      const txtFiles = entries
        .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"))
        .map((entry) => entry.name)
        .sort((a, b) => a.localeCompare(b));

      const sources: MainCvSource[] = [];
      for (const fileName of txtFiles) {
        const fullPath = path.join(this.cvSourcesDir, fileName);
        const info = await stat(fullPath);
        sources.push({
          fileName,
          relativePath: path.join("doc", fileName),
          sizeBytes: info.size,
          updatedAt: info.mtime.toISOString()
        });
      }

      return ok({ items: sources });
    } catch (error) {
      return fail(
        "CV_SOURCE_SCAN_FAILED",
        error instanceof Error ? error.message : "Could not scan main CV sources"
      );
    }
  }

  async analyzeMainCv(payload: MainCvAnalyzeInput): Promise<ApiResult<MainCvAnalyzeResult>> {
    const sourceFileName = path.basename(payload.sourceFile);
    const sourcePath = path.join(this.cvSourcesDir, sourceFileName);

    try {
      const [text, sourceInfo] = await Promise.all([readFile(sourcePath, "utf-8"), stat(sourcePath)]);
      const extractedSkills = extractSkillsFromCvText(text);
      const mergedSkills = normalizeSkills([...(payload.extraSkills ?? []), ...extractedSkills]);

      if (mergedSkills.length === 0) {
        return fail(
          "CV_SKILLS_NOT_FOUND",
          `No skills could be extracted from ${sourceFileName}; provide extraSkills manually`
        );
      }

      const profile = this.store.createResumeProfile({
        headline: payload.headline.trim(),
        skills: mergedSkills
      });

      return ok({
        source: {
          fileName: sourceFileName,
          relativePath: path.join("doc", sourceFileName),
          sizeBytes: sourceInfo.size,
          updatedAt: sourceInfo.mtime.toISOString()
        },
        extractedSkills,
        resumeProfile: profile
      });
    } catch (error) {
      return fail(
        "CV_ANALYSIS_FAILED",
        error instanceof Error ? error.message : `Could not analyze source ${sourceFileName}`
      );
    }
  }

  failMainCvValidation(): ApiResult<never> {
    return fail(
      "INVALID_MAIN_CV_PAYLOAD",
      "Payload must include sourceFile, headline and optional extraSkills[]"
    );
  }
}
