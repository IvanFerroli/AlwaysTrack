import { afterEach, describe, expect, it, vi } from "vitest";
import { api } from "../src/api";

describe("api client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns data and sends session credentials with JSON headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({ ok: true, data: { id: "case-1" } })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(api<{ id: string }>("/v1/cases")).resolves.toEqual({ id: "case-1" });
    expect(fetchMock).toHaveBeenCalledWith("/v1/cases", expect.objectContaining({
      credentials: "include",
      headers: { "content-type": "application/json" }
    }));
  });

  it("surfaces the API error message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "FORBIDDEN", message: "Acesso negado para este perfil." }
      })
    }));

    await expect(api("/v1/admin")).rejects.toThrow("Acesso negado para este perfil.");
  });
});
