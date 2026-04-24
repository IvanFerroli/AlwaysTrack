import type { ApiResult, PingPayload } from "@olympus/shared-types";
import type { HttpHandler } from "../../core/http/types.js";
import { sendApiResult } from "../../core/http/send.js";

function makePingPayload(): ApiResult<PingPayload> {
  return {
    ok: true,
    data: {
      message: "pong",
      timestamp: new Date().toISOString()
    }
  };
}

export const pingHandler: HttpHandler = ({ response }) => {
  sendApiResult(response, makePingPayload());
};
