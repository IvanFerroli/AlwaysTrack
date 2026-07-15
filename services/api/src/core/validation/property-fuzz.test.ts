import { describe, expect, it } from "vitest";
import { FileValidationError, detectAllowedFileType, validateAllowedFile } from "../documents/file-validation.js";
import {
  InputValidationError,
  optionalArray,
  optionalBoolean,
  optionalEnum,
  optionalInteger,
  optionalNumber,
  optionalString,
  optionalStringArray,
  parseObjectPayload
} from "./input-validation.js";

const httpSeed = 0x0322_a11c;
const uploadSeed = 0x0322_b10b;

function seeded(seed: number) {
  let state = seed >>> 0;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x1_0000_0000;
  };
}

function arbitraryJson(random: () => number, depth = 0): unknown {
  const scalars: unknown[] = [null, false, true, 0, -1, Number.MAX_VALUE, "", "synthetic", "<b>fake</b>", "\u0000", "ç漢🙂"];
  if (depth >= 3 || random() < 0.6) return scalars[Math.floor(random() * scalars.length)];
  if (random() < 0.5) return Array.from({ length: Math.floor(random() * 8) }, () => arbitraryJson(random, depth + 1));
  return Object.fromEntries(Array.from({ length: Math.floor(random() * 8) }, (_, index) => [`field_${index}`, arbitraryJson(random, depth + 1)]));
}

describe("seeded HTTP schema properties", () => {
  it("accepts values only inside declared type and size limits", () => {
    const random = seeded(httpSeed);
    const parsers: Array<(input: Record<string, unknown>) => unknown> = [
      (input: Record<string, unknown>) => optionalString(input, "field_0", { maxLength: 32 }),
      (input: Record<string, unknown>) => optionalBoolean(input, "field_0"),
      (input: Record<string, unknown>) => optionalEnum(input, "field_0", ["A", "B"]),
      (input: Record<string, unknown>) => optionalInteger(input, "field_0", { min: 0, max: 100 }),
      (input: Record<string, unknown>) => optionalNumber(input, "field_0", { min: 0, max: 100 }),
      (input: Record<string, unknown>) => optionalArray(input, "field_0", { maxItems: 5 }),
      (input: Record<string, unknown>) => optionalStringArray(input, "field_0", { maxItems: 5, itemMaxLength: 16 })
    ];

    for (let iteration = 0; iteration < 500; iteration += 1) {
      const candidate = arbitraryJson(random);
      for (const parser of parsers) {
        try {
          parseObjectPayload(candidate, parser);
        } catch (error) {
          expect(error).toBeInstanceOf(InputValidationError);
          expect(JSON.stringify((error as InputValidationError).issues)).not.toContain("<b>fake</b>");
        }
      }
    }
  }, 5_000);

  it("keeps exact boundaries reproducible and rejects duplicate overflow", () => {
    expect(optionalString({ value: "x".repeat(32) }, "value", { maxLength: 32 })).toHaveLength(32);
    expect(() => optionalString({ value: "x".repeat(33) }, "value", { maxLength: 32 })).toThrow(InputValidationError);
    expect(optionalStringArray({ values: Array(5).fill("same") }, "values", { maxItems: 5, itemMaxLength: 16 })).toHaveLength(5);
    expect(() => optionalStringArray({ values: Array(6).fill("same") }, "values", { maxItems: 5, itemMaxLength: 16 })).toThrow(InputValidationError);
  });
});

describe("seeded upload parser properties", () => {
  it("classifies truncated and random bytes without crashing", () => {
    const signatures = [
      Buffer.from("%PDF", "ascii"),
      Buffer.from([0xff, 0xd8, 0xff, 0x00]),
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from("RIFF0000WEBP", "ascii")
    ];
    for (const signature of signatures) {
      for (let length = 0; length < signature.length; length += 1) expect(() => detectAllowedFileType(signature.subarray(0, length))).not.toThrow();
    }

    const random = seeded(uploadSeed);
    for (let iteration = 0; iteration < 1_000; iteration += 1) {
      const body = Buffer.from(Array.from({ length: Math.floor(random() * 128) }, () => Math.floor(random() * 256)));
      expect(() => detectAllowedFileType(body)).not.toThrow();
    }
  }, 5_000);

  it("fails closed for mismatched, unexpected and oversized uploads", () => {
    const cases = [
      { body: Buffer.from("%PDF-1.7"), mimeType: "image/png" },
      { body: Buffer.from("<svg><script>fake</script></svg>"), mimeType: "application/xml" },
      { body: Buffer.from("RIFF0000NOPE"), mimeType: "image/webp" }
    ];
    for (const candidate of cases) {
      expect(() => validateAllowedFile({ ...candidate, allowedKinds: new Set(["pdf", "xml", "png", "webp"]), configuredMaxBytes: 1024 })).toThrow(FileValidationError);
    }
    expect(() => validateAllowedFile({
      body: Buffer.concat([Buffer.from("%PDF"), Buffer.alloc(1_021)]),
      mimeType: "application/pdf",
      allowedKinds: new Set(["pdf"]),
      configuredMaxBytes: 1_024
    })).toThrowError(expect.objectContaining({ code: "FILE_TOO_LARGE" }));
  });
});
