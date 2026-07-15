import { describe, expect, it } from "vitest";
import { companionHelloSchema, companionProtocolLimits, parseCompanionJson } from "../companion/protocol.js";
import { parseAlwaysChatIntake } from "./alwayschat.js";
import { parseCorreiosReverseResult } from "./correios-reversa.js";
import { parseJtVipResult } from "./jt-vip.js";
import { parseLancadorQueryResult } from "./lancador.js";
import { parseLoggiResult } from "./loggi.js";
import { parseOmieResult } from "./omie.js";
import { connectorParserLimits } from "./parser.js";
import { parseRastreioSearchResult } from "./rastreio.js";
import { parseYampiResult } from "./yampi.js";

const connectorSeed = 0x0322_c0de;
const protocolSeed = 0x0322_f00d;

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
  const scalars: unknown[] = [null, false, true, 0, -1, Number.MAX_SAFE_INTEGER, "", "synthetic", "<p>fake</p>", "\u0000", "東京🙂"];
  if (depth >= 3 || random() < 0.55) return scalars[Math.floor(random() * scalars.length)];
  if (random() < 0.45) return Array.from({ length: Math.floor(random() * 6) }, () => arbitraryJson(random, depth + 1));
  return Object.fromEntries(Array.from({ length: Math.floor(random() * 6) }, (_, index) => [`field_${index}`, arbitraryJson(random, depth + 1)]));
}

const parsers = [
  parseAlwaysChatIntake,
  parseRastreioSearchResult,
  parseYampiResult,
  parseOmieResult,
  parseLoggiResult,
  parseJtVipResult,
  parseCorreiosReverseResult,
  parseLancadorQueryResult
];

describe("seeded connector parser properties", () => {
  it("fails closed for bounded unexpected JSON without leaking input", () => {
    const random = seeded(connectorSeed);
    for (let iteration = 0; iteration < 400; iteration += 1) {
      const candidate = arbitraryJson(random);
      for (const parser of parsers) {
        try {
          parser(candidate);
        } catch (error) {
          expect(error).toBeInstanceOf(TypeError);
          expect(String(error)).not.toContain("<p>fake</p>");
        }
      }
    }
  }, 5_000);

  it("enforces collection and string limits at their exact boundaries", () => {
    const base = {
      outcome: "FOUND",
      records: [{
        id: "order-1",
        products: [],
        total: 1,
        shipping: 0,
        coupons: [],
        orderBumps: [],
        upsells: [],
        transactionIds: [],
        status: "ok"
      }]
    };
    expect(parseYampiResult({ ...base, records: Array(connectorParserLimits.maxCollectionItems).fill(base.records[0]) }).records).toHaveLength(100);
    expect(() => parseYampiResult({ ...base, records: Array(connectorParserLimits.maxCollectionItems + 1).fill(base.records[0]) })).toThrow(TypeError);
    expect(() => parseYampiResult({ ...base, records: [{ ...base.records[0], id: "x".repeat(connectorParserLimits.maxStringLength + 1) }] })).toThrow(TypeError);
  });

  it("handles duplicate and unexpected fields deterministically", () => {
    const record = {
      authorization: "authorization-1",
      recipient: "Synthetic Recipient",
      reverseCode: "reverse-1",
      validity: "2026-07-16T00:00:00Z",
      state: "OPEN"
    };
    const input = { outcome: "FOUND", records: [record, { ...record }], unexpected: { nested: true } };
    const reordered = Object.fromEntries(Object.entries(input).reverse());
    expect(parseCorreiosReverseResult(input)).toEqual(parseCorreiosReverseResult(reordered));
    expect(parseCorreiosReverseResult(input).records).toHaveLength(2);
  });
});

describe("seeded Companion protocol properties", () => {
  it("rejects every truncated JSON prefix and bounded random payload without throwing", () => {
    const complete = JSON.stringify({ type: "COMPANION_HELLO", payload: { token: "synthetic" } });
    for (let cut = 0; cut < complete.length; cut += 1) expect(parseCompanionJson(complete.slice(0, cut))).toBeUndefined();

    const random = seeded(protocolSeed);
    for (let iteration = 0; iteration < 500; iteration += 1) {
      const value = JSON.stringify(arbitraryJson(random));
      expect(() => parseCompanionJson(value)).not.toThrow();
    }
  }, 5_000);

  it("rejects oversized, extreme and hostile handshake values", () => {
    expect(parseCompanionJson(JSON.stringify("x".repeat(companionProtocolLimits.maxPayloadBytes)))).toBeUndefined();
    const hostile = Object.defineProperty({}, "payload", { get() { throw new Error("synthetic getter"); } });
    expect(companionHelloSchema.safeParse(hostile).success).toBe(false);

    const envelope = {
      type: "COMPANION_HELLO",
      protocolVersion: "1",
      messageId: "message-1",
      timestamp: "2026-07-15T12:00:00.000Z",
      extensionInstanceId: "extension-1",
      payload: { token: "token-1", supportedProtocolVersions: ["1"] }
    };
    expect(companionHelloSchema.safeParse(envelope).success).toBe(true);
    expect(companionHelloSchema.safeParse({ ...envelope, messageId: "m".repeat(companionProtocolLimits.maxStringLength + 1) }).success).toBe(false);
    expect(companionHelloSchema.safeParse({ ...envelope, payload: { ...envelope.payload, supportedProtocolVersions: Array(9).fill("1") } }).success).toBe(false);
  });
});
