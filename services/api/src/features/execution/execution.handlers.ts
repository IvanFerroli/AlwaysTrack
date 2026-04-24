import type { HttpHandler } from "../../core/http/types.js";
import { readJsonBody } from "../../core/http/read-json.js";
import { sendApiResult } from "../../core/http/send.js";
import { ExecutionService } from "./execution.service.js";
import {
  validateExecutionPayload,
  validateRejectExecutionPayload,
  validateUpdateApplicationStatusPayload
} from "./execution.validate.js";

export function createExecutionHandlers(service: ExecutionService): {
  listApprovalQueue: HttpHandler;
  approve: HttpHandler;
  reject: HttpHandler;
  listApplications: HttpHandler;
  updateApplicationStatus: HttpHandler;
} {
  const listApprovalQueue: HttpHandler = ({ response }) => {
    sendApiResult(response, service.listApprovalQueue());
  };

  const approve: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateExecutionPayload(payload)) {
      sendApiResult(response, service.failValidation());
      return;
    }
    sendApiResult(response, service.approve(payload));
  };

  const reject: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateRejectExecutionPayload(payload)) {
      sendApiResult(response, service.failRejectValidation());
      return;
    }
    sendApiResult(response, service.reject(payload));
  };

  const listApplications: HttpHandler = ({ response }) => {
    sendApiResult(response, service.listApplications());
  };

  const updateApplicationStatus: HttpHandler = async ({ request, response }) => {
    const payload = await readJsonBody(request);
    if (!validateUpdateApplicationStatusPayload(payload)) {
      sendApiResult(response, service.failUpdateApplicationValidation());
      return;
    }
    sendApiResult(response, service.updateApplicationStatus(payload));
  };

  return { listApprovalQueue, approve, reject, listApplications, updateApplicationStatus };
}
