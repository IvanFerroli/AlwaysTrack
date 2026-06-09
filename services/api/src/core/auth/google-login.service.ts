import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { ApiEnv } from "../../config/env.js";

const googleAuthorizeUrl = "https://accounts.google.com/o/oauth2/v2/auth";
const googleTokenUrl = "https://oauth2.googleapis.com/token";
const googleUserInfoUrl = "https://www.googleapis.com/oauth2/v3/userinfo";
const googleLoginScopes = ["openid", "email", "profile"] as const;
const stateMaxAgeMs = 10 * 60 * 1000;

type Fetcher = typeof fetch;

interface StateCookiePayload {
  nonce: string;
  codeVerifier: string;
  issuedAt: number;
}

interface TokenPayload {
  access_token?: string;
  error?: string;
  error_description?: string;
}

export interface GoogleLoginProfile {
  email: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

interface GoogleUserInfoPayload {
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
  error?: string;
  error_description?: string;
}

export class GoogleLoginError extends Error {
  constructor(
    public readonly code: "NOT_CONFIGURED" | "INVALID_STATE" | "TOKEN_EXCHANGE_FAILED" | "PROFILE_UNAVAILABLE",
    message: string = code
  ) {
    super(message);
  }
}

export function isGoogleLoginConfigured(env: ApiEnv) {
  return Boolean(env.googleLoginClientId && env.googleLoginClientSecret && env.googleLoginRedirectUri);
}

function encodeBase64Url(value: Buffer | string) {
  return Buffer.from(value).toString("base64url");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest();
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function signedJson(value: unknown, secret: string) {
  const body = encodeBase64Url(JSON.stringify(value));
  return `${body}.${sign(body, secret)}`;
}

function parseSignedJson<T>(token: string | undefined, secret: string): T | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body, secret);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export function createGoogleLoginStart(env: ApiEnv) {
  if (!isGoogleLoginConfigured(env)) {
    throw new GoogleLoginError("NOT_CONFIGURED", "Google login is not configured for this environment.");
  }

  const nonce = encodeBase64Url(randomBytes(32));
  const codeVerifier = encodeBase64Url(randomBytes(48));
  const codeChallenge = encodeBase64Url(sha256(codeVerifier));
  const state = signedJson({ nonce, issuedAt: Date.now() }, env.sessionSecret);
  const stateCookie = signedJson({ nonce, codeVerifier, issuedAt: Date.now() }, env.sessionSecret);

  const url = new URL(googleAuthorizeUrl);
  url.searchParams.set("client_id", env.googleLoginClientId as string);
  url.searchParams.set("redirect_uri", env.googleLoginRedirectUri as string);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", googleLoginScopes.join(" "));
  url.searchParams.set("prompt", "select_account");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");

  return { url: url.toString(), stateCookie };
}

function validateState(input: { state?: string; stateCookie?: string }, env: ApiEnv) {
  const state = parseSignedJson<{ nonce: string; issuedAt: number }>(input.state, env.sessionSecret);
  const cookie = parseSignedJson<StateCookiePayload>(input.stateCookie, env.sessionSecret);
  if (!state || !cookie || state.nonce !== cookie.nonce) {
    throw new GoogleLoginError("INVALID_STATE", "Google login state is invalid or expired.");
  }
  if (Date.now() - Math.min(state.issuedAt, cookie.issuedAt) > stateMaxAgeMs) {
    throw new GoogleLoginError("INVALID_STATE", "Google login state is invalid or expired.");
  }
  return cookie;
}

export async function resolveGoogleLoginProfile(
  input: { code?: string; state?: string; stateCookie?: string; error?: string },
  env: ApiEnv,
  fetcher: Fetcher = fetch
): Promise<GoogleLoginProfile> {
  if (!isGoogleLoginConfigured(env)) {
    throw new GoogleLoginError("NOT_CONFIGURED", "Google login is not configured for this environment.");
  }
  if (input.error) {
    throw new GoogleLoginError("TOKEN_EXCHANGE_FAILED", `Google login failed: ${input.error}`);
  }
  if (!input.code || !input.state) {
    throw new GoogleLoginError("INVALID_STATE", "Google login callback is missing code/state.");
  }

  const stateCookie = validateState(input, env);
  const tokenResponse = await fetcher(googleTokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: env.googleLoginClientId as string,
      client_secret: env.googleLoginClientSecret as string,
      redirect_uri: env.googleLoginRedirectUri as string,
      grant_type: "authorization_code",
      code_verifier: stateCookie.codeVerifier
    })
  });
  const tokenPayload = (await tokenResponse.json()) as TokenPayload;
  if (!tokenResponse.ok || !tokenPayload.access_token) {
    throw new GoogleLoginError(
      "TOKEN_EXCHANGE_FAILED",
      tokenPayload.error_description || tokenPayload.error || "Google login token exchange failed."
    );
  }

  const profileResponse = await fetcher(googleUserInfoUrl, {
    headers: { authorization: `Bearer ${tokenPayload.access_token}` }
  });
  const profile = (await profileResponse.json()) as GoogleUserInfoPayload;
  if (!profileResponse.ok || !profile.email) {
    throw new GoogleLoginError(
      "PROFILE_UNAVAILABLE",
      profile.error_description || profile.error || "Google profile did not include an email."
    );
  }

  return {
    email: profile.email,
    emailVerified: profile.email_verified === true || profile.email_verified === "true",
    name: profile.name,
    picture: profile.picture
  };
}
