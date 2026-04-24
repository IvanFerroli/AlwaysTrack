import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { MatchService } from "./match.service.js";
import { validateMatchPayload } from "./match.validate.js";

export function createMatchHandlers(service: MatchService): {
  score: HttpHandler;
  listRanked: HttpHandler;
} {
  const score: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateMatchPayload(payload)) {
      sendApiResult(response, service.failValidation());
      return;
    }
    sendApiResult(response, service.score(payload));
  };

  const listRanked: HttpHandler = ({ request, response }) => {
    const rawUrl = request.url ?? "";
    const queryStart = rawUrl.indexOf("?");
    const params = new URLSearchParams(queryStart >= 0 ? rawUrl.slice(queryStart + 1) : "");
    const resumeProfileId = params.get("resumeProfileId") ?? undefined;
    sendApiResult(response, service.listRanked(resumeProfileId));
  };

  return { score, listRanked };
}
