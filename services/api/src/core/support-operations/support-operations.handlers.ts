import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import {
  SupportOperationsError,
  bookSupportPauseSlot,
  cancelSupportPauseBooking,
  cancelSupportPauseSwap,
  createSupportCampaign,
  createSupportKpiEntry,
  createSupportPauseSlot,
  decideSupportPauseSwap,
  generateSupportPauseSlots,
  getSupportDashboard,
  listSupportCampaigns,
  listSupportPauses,
  listSupportPerformance,
  rescheduleSupportPauseBooking,
  requestSupportPauseSwap,
  reviewSupportKpiEntry,
  submitSupportKpiEntry,
  updateSupportCampaign,
  updateSupportKpiEntry,
  updateSupportPausePolicy
} from "./support-operations.service.js";

function actor(request: Request) {
  if (!request.user) throw new SupportOperationsError("FORBIDDEN");
  return request.user;
}

function queryText(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function param(value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw new SupportOperationsError("INVALID_INPUT");
  return value;
}

function failure(response: Response, error: unknown) {
  if (!(error instanceof SupportOperationsError)) return sendError(response, 500, "SUPPORT_OPERATIONS_FAILED", "Falha na operação SAC.");
  const status = error.code === "NOT_FOUND" ? 404 : error.code === "FORBIDDEN" ? 403 : error.code === "CONFLICT" ? 409 : 400;
  const message = error.code === "CONFLICT"
    ? "A operação conflita com capacidade, horário ou estado atual."
    : error.code === "FORBIDDEN" ? "Ação não permitida para este perfil." : "Dados inválidos para a operação.";
  return sendError(response, status, error.code, message);
}

export async function listSupportPausesHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listSupportPauses(
      prisma,
      actor(request),
      queryText(request.query.date),
      queryText(request.query.teamId)
    ));
  } catch (error) { return failure(response, error); }
}

export async function updateSupportPausePolicyHandler(request: Request, response: Response) {
  try { return sendOk(response, await updateSupportPausePolicy(prisma, actor(request), request.body)); } catch (error) { return failure(response, error); }
}

export async function createSupportPauseSlotHandler(request: Request, response: Response) {
  try { return sendOk(response, await createSupportPauseSlot(prisma, actor(request), request.body)); } catch (error) { return failure(response, error); }
}

export async function generateSupportPauseSlotsHandler(request: Request, response: Response) {
  try { return sendOk(response, await generateSupportPauseSlots(prisma, actor(request), request.body)); } catch (error) { return failure(response, error); }
}

export async function bookSupportPauseSlotHandler(request: Request, response: Response) {
  try { return sendOk(response, await bookSupportPauseSlot(prisma, actor(request), param(request.params.slotId), request.body)); } catch (error) { return failure(response, error); }
}

export async function cancelSupportPauseBookingHandler(request: Request, response: Response) {
  try { return sendOk(response, await cancelSupportPauseBooking(prisma, actor(request), param(request.params.bookingId), request.body)); } catch (error) { return failure(response, error); }
}

export async function rescheduleSupportPauseBookingHandler(request: Request, response: Response) {
  try { return sendOk(response, await rescheduleSupportPauseBooking(prisma, actor(request), param(request.params.bookingId), request.body)); } catch (error) { return failure(response, error); }
}

export async function requestSupportPauseSwapHandler(request: Request, response: Response) {
  try { return sendOk(response, await requestSupportPauseSwap(prisma, actor(request), request.body)); } catch (error) { return failure(response, error); }
}

export async function decideSupportPauseSwapHandler(request: Request, response: Response) {
  try { return sendOk(response, await decideSupportPauseSwap(prisma, actor(request), param(request.params.swapId), request.body)); } catch (error) { return failure(response, error); }
}

export async function cancelSupportPauseSwapHandler(request: Request, response: Response) {
  try { return sendOk(response, await cancelSupportPauseSwap(prisma, actor(request), param(request.params.swapId))); } catch (error) { return failure(response, error); }
}

export async function listSupportPerformanceHandler(request: Request, response: Response) {
  try {
    return sendOk(response, await listSupportPerformance(prisma, actor(request), {
      from: queryText(request.query.from),
      to: queryText(request.query.to),
      metric: queryText(request.query.metric),
      userId: queryText(request.query.userId),
      channel: queryText(request.query.channel),
      granularity: queryText(request.query.granularity),
      observationType: queryText(request.query.observationType)
    }));
  } catch (error) { return failure(response, error); }
}

export async function createSupportKpiEntryHandler(request: Request, response: Response) {
  try { return sendOk(response, await createSupportKpiEntry(prisma, actor(request), request.body)); } catch (error) { return failure(response, error); }
}

export async function updateSupportKpiEntryHandler(request: Request, response: Response) {
  try { return sendOk(response, await updateSupportKpiEntry(prisma, actor(request), param(request.params.entryId), request.body)); } catch (error) { return failure(response, error); }
}

export async function submitSupportKpiEntryHandler(request: Request, response: Response) {
  try { return sendOk(response, await submitSupportKpiEntry(prisma, actor(request), param(request.params.entryId))); } catch (error) { return failure(response, error); }
}

export async function reviewSupportKpiEntryHandler(request: Request, response: Response) {
  try { return sendOk(response, await reviewSupportKpiEntry(prisma, actor(request), param(request.params.entryId), request.body)); } catch (error) { return failure(response, error); }
}

export async function listSupportCampaignsHandler(request: Request, response: Response) {
  try { return sendOk(response, await listSupportCampaigns(prisma, actor(request))); } catch (error) { return failure(response, error); }
}

export async function createSupportCampaignHandler(request: Request, response: Response) {
  try { return sendOk(response, await createSupportCampaign(prisma, actor(request), request.body)); } catch (error) { return failure(response, error); }
}

export async function updateSupportCampaignHandler(request: Request, response: Response) {
  try { return sendOk(response, await updateSupportCampaign(prisma, actor(request), param(request.params.campaignId), request.body)); } catch (error) { return failure(response, error); }
}

export async function supportDashboardHandler(request: Request, response: Response) {
  try { return sendOk(response, await getSupportDashboard(prisma, actor(request), queryText(request.query.date))); } catch (error) { return failure(response, error); }
}
