import { describe, expect, it } from "vitest";
import { possibilityStatus, visiblePossibilities, type Possibility } from "./possibilities.js";

const possibility = (state: Possibility["state"]): Possibility => ({ id: state, title: state, condition: "condicao", action: "acao", message: "mensagem", risk: "LOW", state });

describe("possibility map", () => {
  it("does not expose impossible branches as actions", () => {
    expect(visiblePossibilities([possibility("AVAILABLE"), possibility("IMPOSSIBLE")]).map(({ state }) => state)).toEqual(["AVAILABLE"]);
  });

  it("turns unknown and conflicting branches into pending states", () => {
    expect(possibilityStatus(possibility("UNKNOWN"))).toBe("Pendente de confirmacao");
    expect(possibilityStatus(possibility("CONFLICTING"))).toBe("Bloqueada por conflito");
  });
});
