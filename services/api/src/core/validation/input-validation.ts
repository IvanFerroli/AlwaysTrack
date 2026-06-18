import type { Response } from "express";
import { sendError } from "../http/responses.js";

export interface ValidationIssue {
  field: string;
  code: "INVALID_TYPE" | "INVALID_VALUE" | "TOO_LONG" | "TOO_MANY_ITEMS" | "OUT_OF_RANGE";
}

export class InputValidationError extends Error {
  constructor(public readonly issues: ValidationIssue[]) {
    super("INVALID_INPUT");
  }
}

export function isInputValidationError(error: unknown): error is InputValidationError {
  return error instanceof InputValidationError;
}

export function sendInputValidationError(response: Response) {
  return sendError(response, 400, "INVALID_INPUT", "Invalid request payload.");
}

export function parseObjectPayload<T>(payload: unknown, parser: (input: Record<string, unknown>) => T): T {
  if (!isPlainObject(payload)) {
    throw new InputValidationError([{ field: "$", code: "INVALID_TYPE" }]);
  }
  return parser(payload);
}

export function optionalString(input: Record<string, unknown>, field: string, options: { maxLength: number; nullable: true }): string | null | undefined;
export function optionalString(input: Record<string, unknown>, field: string, options: { maxLength: number; nullable?: false }): string | undefined;
export function optionalString(input: Record<string, unknown>, field: string, options: { maxLength: number; nullable?: boolean }): string | null | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  if (value === null && options.nullable) return null;
  if (typeof value !== "string") throw invalid(field, "INVALID_TYPE");
  const trimmed = value.trim();
  if (trimmed.length > options.maxLength) throw invalid(field, "TOO_LONG");
  if (trimmed.length === 0) return options.nullable ? null : undefined;
  return trimmed;
}

export function optionalBoolean(input: Record<string, unknown>, field: string): boolean | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  if (typeof value !== "boolean") throw invalid(field, "INVALID_TYPE");
  return value;
}

export function optionalEnum<T extends string>(input: Record<string, unknown>, field: string, values: readonly T[]): T | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  if (typeof value !== "string") throw invalid(field, "INVALID_TYPE");
  const trimmed = value.trim();
  if (!values.includes(trimmed as T)) throw invalid(field, "INVALID_VALUE");
  return trimmed as T;
}

export function optionalInteger(input: Record<string, unknown>, field: string, options: { min?: number; max?: number } = {}): number | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  if (!Number.isInteger(parsed)) throw invalid(field, "INVALID_TYPE");
  if ((options.min !== undefined && parsed < options.min) || (options.max !== undefined && parsed > options.max)) {
    throw invalid(field, "OUT_OF_RANGE");
  }
  return parsed;
}

export function optionalNumber(input: Record<string, unknown>, field: string, options: { min?: number; max?: number; nullable: true }): number | null | undefined;
export function optionalNumber(input: Record<string, unknown>, field: string, options?: { min?: number; max?: number; nullable?: false }): number | undefined;
export function optionalNumber(input: Record<string, unknown>, field: string, options: { min?: number; max?: number; nullable?: boolean } = {}): number | null | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  if (value === null && options.nullable) return null;
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  if (!Number.isFinite(parsed)) throw invalid(field, "INVALID_TYPE");
  if ((options.min !== undefined && parsed < options.min) || (options.max !== undefined && parsed > options.max)) {
    throw invalid(field, "OUT_OF_RANGE");
  }
  return parsed;
}

export function optionalArray(input: Record<string, unknown>, field: string, options: { maxItems: number }): unknown[] | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw invalid(field, "INVALID_TYPE");
  if (value.length > options.maxItems) throw invalid(field, "TOO_MANY_ITEMS");
  return value;
}

export function optionalStringArray(input: Record<string, unknown>, field: string, options: { maxItems: number; itemMaxLength: number }): string[] | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw invalid(field, "INVALID_TYPE");
  if (value.length > options.maxItems) throw invalid(field, "TOO_MANY_ITEMS");
  return value.map((item, index) => {
    if (typeof item !== "string") throw invalid(`${field}.${index}`, "INVALID_TYPE");
    const trimmed = item.trim();
    if (trimmed.length > options.itemMaxLength) throw invalid(`${field}.${index}`, "TOO_LONG");
    return trimmed;
  });
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && !Buffer.isBuffer(value);
}

function invalid(field: string, code: ValidationIssue["code"]): InputValidationError {
  return new InputValidationError([{ field, code }]);
}
