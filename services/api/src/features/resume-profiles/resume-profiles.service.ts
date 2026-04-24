import type { ApiResult, ListPayload, ResumeProfile, ResumeProfileCreateInput } from "@olympus/shared-types";
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

export class ResumeProfilesService {
  constructor(private readonly store: InMemoryStateStore) {}

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

  failValidation(): ApiResult<never> {
    return fail("INVALID_RESUME_PROFILE_PAYLOAD", "Payload must include headline and skills[]");
  }
}
