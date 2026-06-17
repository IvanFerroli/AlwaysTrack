import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
const keyLength = 64;
const minimumPasswordLength = 12;
const obviousPasswords = new Set([
  "password",
  "password1",
  "password123",
  "admin123",
  "admin123456",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "always123",
  "alwaystrack"
]);

export interface PasswordPolicyInput {
  email?: string;
}

export function validatePasswordPolicy(password: string | undefined, input: PasswordPolicyInput = {}) {
  if (!password || password.length < minimumPasswordLength) {
    return { valid: false, reason: "MIN_LENGTH" as const };
  }

  const normalized = password.toLowerCase();
  const email = input.email?.trim().toLowerCase();
  const emailLocalPart = email?.split("@")[0];
  if (obviousPasswords.has(normalized) || normalized.includes("password") || normalized.includes("senha")) {
    return { valid: false, reason: "OBVIOUS" as const };
  }
  if (email && normalized === email) {
    return { valid: false, reason: "EMAIL_MATCH" as const };
  }
  if (emailLocalPart && emailLocalPart.length >= 4 && normalized.includes(emailLocalPart)) {
    return { valid: false, reason: "EMAIL_MATCH" as const };
  }

  const classes = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password)
  ].filter(Boolean).length;
  if (classes < 3) {
    return { valid: false, reason: "COMPLEXITY" as const };
  }

  return { valid: true, reason: null };
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, keyLength)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, key] = passwordHash.split(":");
  if (algorithm !== "scrypt" || !salt || !key) {
    return false;
  }

  const storedKey = Buffer.from(key, "hex");
  const derivedKey = (await scrypt(password, salt, storedKey.length)) as Buffer;
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey);
}
