import type { Request, Response } from "express";
import { loadEnv } from "../../../config/env.js";
import { prisma } from "../../db/prisma.js";
import { sendError, sendOk } from "../../http/responses.js";
import { ImportError } from "../../imports/professionals-licenses-import.service.js";
import {
  createGoogleOauthStartUrl,
  disconnectGoogleOauthConnection,
  getGoogleConnectionStatus,
  handleGoogleOauthCallback
} from "./google-oauth.service.js";

function actorFrom(request: Request) {
  if (!request.user) {
    throw new ImportError("FORBIDDEN");
  }
  return request.user;
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function callbackHtml(status: "success" | "error", message: string, targetOrigin?: string, appName = "AlwaysTrack") {
  const payload = JSON.stringify({
    type: "alwaystrack-google-oauth",
    status,
    message
  });
  const origin = JSON.stringify(targetOrigin || "*");
  const safeMessage = escapeHtml(message);
  const safeAppName = escapeHtml(appName);

  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <title>${safeAppName} - Google</title>
  </head>
  <body style="font-family: sans-serif; padding: 24px;">
    <p>${safeMessage}</p>
    <script>
      (function () {
        try {
          if (window.opener && !window.opener.closed) {
            window.opener.postMessage(${payload}, ${origin});
          }
        } catch (error) {}
        setTimeout(function () { window.close(); }, 150);
      })();
    </script>
  </body>
</html>`;
}

export async function googleIntegrationStatusHandler(request: Request, response: Response) {
  try {
    const result = await getGoogleConnectionStatus(prisma, actorFrom(request));
    return sendOk(response, result);
  } catch (error) {
    if (error instanceof ImportError && error.code === "FORBIDDEN") {
      return sendError(response, 403, "FORBIDDEN", "Access denied.");
    }
    throw error;
  }
}

export async function googleOauthStartHandler(request: Request, response: Response) {
  try {
    const url = await createGoogleOauthStartUrl(prisma, actorFrom(request));
    return response.redirect(url);
  } catch (error) {
    if (error instanceof ImportError) {
      const status = error.code === "FORBIDDEN" ? 403 : 503;
      return sendError(response, status, error.code, error.detail ?? error.message);
    }
    throw error;
  }
}

export async function googleOauthCallbackHandler(request: Request, response: Response) {
  const env = loadEnv();
  try {
    await handleGoogleOauthCallback(
      prisma,
      {
        code: typeof request.query.code === "string" ? request.query.code : undefined,
        state: typeof request.query.state === "string" ? request.query.state : undefined,
        error: typeof request.query.error === "string" ? request.query.error : undefined
      },
      env
    );
    response.header("content-type", "text/html; charset=utf-8");
    return response
      .status(200)
      .send(callbackHtml("success", `Conexão Google concluída. Pode voltar para o ${env.appName}.`, env.corsOrigin, env.appName));
  } catch (error) {
    const message =
      error instanceof ImportError
        ? error.detail ?? error.message
        : "Não foi possível concluir a conexão com o Google.";
    response.header("content-type", "text/html; charset=utf-8");
    return response.status(200).send(callbackHtml("error", message, env.corsOrigin, env.appName));
  }
}

export async function googleIntegrationDisconnectHandler(request: Request, response: Response) {
  try {
    const result = await disconnectGoogleOauthConnection(prisma, actorFrom(request));
    return sendOk(response, result);
  } catch (error) {
    if (error instanceof ImportError) {
      const status = error.code === "FORBIDDEN" ? 403 : 400;
      return sendError(response, status, error.code, error.detail ?? error.message);
    }
    throw error;
  }
}
