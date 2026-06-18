import type { Request, Response } from "express";
import { parse } from "cookie";
import { serialize } from "cookie";
import { loadEnv } from "../../config/env.js";
import { recordAuditLog } from "../audit/audit.service.js";
import { prisma } from "../db/prisma.js";
import { sendError, sendOk } from "../http/responses.js";
import { AuthError, loginUser, loginUserByVerifiedGoogleEmail, parseLoginInput } from "./auth.service.js";
import { isInputValidationError, sendInputValidationError } from "../validation/input-validation.js";
import {
  createGoogleLoginStart,
  GoogleLoginError,
  isGoogleLoginConfigured,
  resolveGoogleLoginProfile
} from "./google-login.service.js";
import { getSessionCookieName, getSessionMaxAgeSeconds } from "./session.js";

const googleLoginStateCookieName = "alwaystrack_google_login_state";

function sessionCookie(token: string, env = loadEnv()) {
  return serialize(getSessionCookieName(env), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: getSessionMaxAgeSeconds()
  });
}

function clearGoogleLoginStateCookie() {
  return serialize(googleLoginStateCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

function googleLoginStateCookie(value: string) {
  return serialize(googleLoginStateCookieName, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60
  });
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function googleLoginCallbackHtml(status: "success" | "error", message: string, targetOrigin?: string, appName = "AlwaysTrack") {
  const payload = JSON.stringify({
    type: "alwaystrack-google-login",
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
    <title>${safeAppName} - Login Google</title>
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

function authErrorMessage(error: AuthError) {
  if (error.code === "EMAIL_NOT_VERIFIED") return "Google account email is not verified.";
  if (error.code === "DOMAIN_NOT_ALLOWED") return "Google account domain is not allowed.";
  return "Invalid Google account or user status.";
}

export async function loginHandler(request: Request, response: Response) {
  try {
    const body = parseLoginInput(request.body);
    if (!body.email || !body.password) {
      return sendError(response, 400, "INVALID_INPUT", "Email and password are required.");
    }
    const env = loadEnv();
    const result = await loginUser(prisma, { email: body.email, password: body.password }, env.sessionSecret);
    response.setHeader(
      "set-cookie",
      sessionCookie(result.token, env)
    );
    return sendOk(response, { user: result.user });
  } catch (error) {
    if (error instanceof AuthError) {
      return sendError(response, 401, error.code, "Invalid email, password, or user status.");
    }
    if (isInputValidationError(error)) return sendInputValidationError(response);
    throw error;
  }
}

export function googleLoginStatusHandler(_request: Request, response: Response) {
  const env = loadEnv();
  return sendOk(response, { configured: isGoogleLoginConfigured(env) && Boolean(env.googleLoginAllowedDomains?.length) });
}

export async function googleLoginStartHandler(_request: Request, response: Response) {
  try {
    const env = loadEnv();
    if (!env.googleLoginAllowedDomains?.length) {
      return sendError(response, 503, "NOT_CONFIGURED", "Google login requires at least one allowed company domain.");
    }
    const result = createGoogleLoginStart(env);
    response.setHeader("set-cookie", googleLoginStateCookie(result.stateCookie));
    return response.redirect(result.url);
  } catch (error) {
    if (error instanceof GoogleLoginError) {
      return sendError(response, 503, error.code, error.message);
    }
    throw error;
  }
}

export async function googleLoginCallbackHandler(request: Request, response: Response) {
  const env = loadEnv();
  response.header("content-type", "text/html; charset=utf-8");

  try {
    const cookies = parse(request.header("cookie") ?? "");
    const profile = await resolveGoogleLoginProfile(
      {
        code: typeof request.query.code === "string" ? request.query.code : undefined,
        state: typeof request.query.state === "string" ? request.query.state : undefined,
        error: typeof request.query.error === "string" ? request.query.error : undefined,
        stateCookie: cookies[googleLoginStateCookieName]
      },
      env
    );
    const result = await loginUserByVerifiedGoogleEmail(
      prisma,
      { email: profile.email, emailVerified: profile.emailVerified, allowedDomains: env.googleLoginAllowedDomains },
      env.sessionSecret
    );
    response.setHeader("set-cookie", [sessionCookie(result.token, env), clearGoogleLoginStateCookie()]);
    return response
      .status(200)
      .send(googleLoginCallbackHtml("success", `Login Google concluído. Pode voltar para o ${env.appName}.`, env.corsOrigin, env.appName));
  } catch (error) {
    response.setHeader("set-cookie", clearGoogleLoginStateCookie());
    const message =
      error instanceof AuthError
        ? authErrorMessage(error)
        : error instanceof GoogleLoginError
          ? error.message
          : "Não foi possível concluir o login com Google.";
    return response.status(200).send(googleLoginCallbackHtml("error", message, env.corsOrigin, env.appName));
  }
}

export async function logoutHandler(request: Request, response: Response) {
  if (request.user) {
    await recordAuditLog(prisma, {
      organizationId: request.user.organizationId,
      actorId: request.user.id,
      action: "auth.logout",
      entityType: "User",
      entityId: request.user.id,
      metadata: { email: request.user.email }
    });
  }

  response.setHeader(
    "set-cookie",
    serialize(getSessionCookieName(), "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0
    })
  );
  return sendOk(response, { loggedOut: true });
}

export function meHandler(request: Request, response: Response) {
  return sendOk(response, { user: request.user });
}
