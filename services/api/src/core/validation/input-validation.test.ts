import type { Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { parseLoginInput } from "../auth/auth.service.js";
import { parseFaqThreadInput } from "../faq/faq.service.js";
import {
  parseSalesDocumentFilters,
  parseSalesDocumentReviewInput
} from "../sales-documents/sales-documents.service.js";
import { parseScriptCopyInput, parseScriptPackInput } from "../script-library/script-library.service.js";
import { parseCreateUserInput } from "../users/users.service.js";
import { parseWikiPageInput } from "../wiki/wiki.service.js";
import { InputValidationError, sendInputValidationError } from "./input-validation.js";

describe("runtime input validation contracts", () => {
  it("rejects malformed auth login password without coercion", () => {
    expect(() => parseLoginInput({ email: "admin@example.com", password: { secret: "super-secret" } })).toThrow(InputValidationError);
  });

  it("rejects oversized users scope arrays", () => {
    expect(() =>
      parseCreateUserInput({
        name: "Admin",
        email: "admin@example.com",
        password: "Rastro#Seguro2026",
        role: "ADMIN",
        unitScopeIds: Array.from({ length: 101 }, (_, index) => `unit-${index}`)
      })
    ).toThrow(InputValidationError);
  });

  it("rejects sales pagination above the documented pageSize maximum", () => {
    expect(() => parseSalesDocumentFilters({ page: "1", pageSize: "101" })).toThrow(InputValidationError);
  });

  it("rejects malformed sales review item numbers", () => {
    expect(() =>
      parseSalesDocumentReviewInput({
        status: "APPROVED",
        items: [{ description: "Whey", quantity: "-1", totalAmountCents: "15990" }]
      })
    ).toThrow(InputValidationError);
  });

  it("rejects oversized wiki page content", () => {
    expect(() => parseWikiPageInput({ title: "Guia", content: "x".repeat(20001) })).toThrow(InputValidationError);
  });

  it("rejects oversized FAQ tag arrays", () => {
    expect(() =>
      parseFaqThreadInput({
        title: "Como aprovar nota?",
        tags: Array.from({ length: 21 }, (_, index) => `tag-${index}`)
      })
    ).toThrow(InputValidationError);
  });

  it("rejects oversized Scriptoteca package script arrays", () => {
    expect(() =>
      parseScriptPackInput({
        title: "Roteiro",
        scriptIds: Array.from({ length: 51 }, (_, index) => `script-${index}`)
      })
    ).toThrow(InputValidationError);
  });

  it("rejects malformed Scriptoteca copy placeholders", () => {
    expect(() =>
      parseScriptCopyInput({
        renderedText: "Oi",
        placeholders: { nome_cliente: { nested: "Ana" } }
      })
    ).toThrow(InputValidationError);
  });

  it("returns a generic 400 error without echoing payload values", () => {
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnValue(undefined);
    const response = {
      status,
      json
    } as unknown as Response;

    sendInputValidationError(response);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      ok: false,
      error: { code: "INVALID_INPUT", message: "Invalid request payload." }
    });
    expect(JSON.stringify(json.mock.calls)).not.toContain("super-secret");
  });
});
