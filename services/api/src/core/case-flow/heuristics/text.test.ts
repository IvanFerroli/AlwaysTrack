import { describe, expect, it } from "vitest";
import { normalizeText } from "./text.js";

describe("CaseFlow heuristic text normalization", () => {
  it("normalizes case, accents, punctuation, whitespace, and common typos", () => {
    const result = normalizeText("  PEDÍO!!! atrazado... e REEEMBOLSO?  ");

    expect(result.normalized).toBe("pedido atrasado e reembolso");
    expect(result.tokens).toEqual(["pedido", "atrasado", "e", "reembolso"]);
    expect(result.signals.synonyms).toEqual(["atraso", "pedido", "reembolso"]);
  });

  it("extracts and canonicalizes CPF, email, order, and tracking codes", () => {
    const result = normalizeText(
      "CPF 123.456.789-09, e-mail Cliente+Loja@Exemplo.COM; pedido nº ab-123/4; rastreio: jt123456789br."
    );

    expect(result.signals.cpfs).toMatchObject([{ value: "12345678909" }]);
    expect(result.signals.emails).toMatchObject([{ value: "cliente+loja@exemplo.com" }]);
    expect(result.signals.orders).toMatchObject([{ value: "AB-123/4" }]);
    expect(result.signals.trackingCodes).toMatchObject([{ value: "JT123456789BR" }]);
  });

  it("supports labeled carrier codes and hash-prefixed orders without treating arbitrary words as codes", () => {
    const result = normalizeText("Pedido #987654 e tracking ABC123456789XYZ. Referência qualquer ABC123456789XYZ.");

    expect(result.signals.orders.map(({ value }) => value)).toEqual(["987654"]);
    expect(result.signals.trackingCodes.map(({ value }) => value)).toEqual(["ABC123456789XYZ"]);
  });

  it("extracts valid dates and BRL values into stable formats", () => {
    const result = normalizeText("Pago R$ 1.234,56 em 29/02/2024; BRL 20,5 em 31/02/2024 e R$10.");

    expect(result.signals.dates.map(({ value }) => value)).toEqual(["2024-02-29"]);
    expect(result.signals.amounts.map(({ value }) => value)).toEqual(["1234.56", "20.50", "10.00"]);
  });

  it("detects standalone numbers without leaking digits embedded in identifiers", () => {
    const result = normalizeText("Tenho 2 pedidos, 10.5 itens e código AB123; CPF 123.456.789-09.");

    expect(result.signals.numbers).toEqual([2, 10.5]);
  });

  it("detects deterministic negation phrases and synonym concepts", () => {
    const result = normalizeText("Não recebi a encomenda, nunca chegou e estou sem rastreio. Quero estorno.");

    expect(result.signals.negations).toEqual(["nao recebi", "nunca chegou", "sem rastreio"]);
    expect(result.signals.synonyms).toEqual(["atraso", "entrega", "pedido", "reembolso", "rastreio"]);
  });

  it("deduplicates repeated signals while preserving the first occurrence", () => {
    const result = normalizeText("CPF 12345678909, novamente 123.456.789-09; pedido 12345 e pedido 12345.");

    expect(result.signals.cpfs).toHaveLength(1);
    expect(result.signals.orders).toHaveLength(1);
    expect(result.signals.cpfs[0].index).toBe(4);
  });

  it("returns empty deterministic signals for empty or punctuation-only input", () => {
    expect(normalizeText(" ... !!! ")).toEqual({
      normalized: "",
      tokens: [],
      signals: {
        numbers: [],
        cpfs: [],
        emails: [],
        orders: [],
        trackingCodes: [],
        dates: [],
        amounts: [],
        negations: [],
        synonyms: []
      }
    });
  });
});
