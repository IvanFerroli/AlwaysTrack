import { afterEach, describe, expect, it, vi } from "vitest";
import { api, uploadOperationalImage, uploadWikiImage } from "../src/api";

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

  it("uploads a Wiki image with its optional page context", async () => {
    const body = new ArrayBuffer(4);
    const file = {
      name: "evidence.png",
      type: "image/png",
      arrayBuffer: vi.fn().mockResolvedValue(body)
    } as unknown as File;
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        ok: true,
        data: { attachment: { id: "attachment-1", fileName: "evidence.png", markdownUrl: "/storage/evidence.png" } }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadWikiImage(file, "page-1")).resolves.toBe("![evidence.png](/storage/evidence.png)");
    expect(fetchMock).toHaveBeenCalledWith(
      "/v1/wiki/attachments?pageId=page-1",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "image/png", "x-file-name": "evidence.png" },
        body
      })
    );
  });

  it("uploads an operational image without adding an absent entity id", async () => {
    const body = new ArrayBuffer(2);
    const file = {
      name: "case.jpg",
      type: "image/jpeg",
      arrayBuffer: vi.fn().mockResolvedValue(body)
    } as unknown as File;
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        ok: true,
        data: { attachment: { id: "attachment-2", fileName: "case.jpg", markdownUrl: "/storage/case.jpg" } }
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(uploadOperationalImage(file, "caseflow")).resolves.toBe("![case.jpg](/storage/case.jpg)");
    expect(fetchMock).toHaveBeenCalledWith(
      "/v1/attachments/operational?surface=caseflow",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "image/jpeg", "x-file-name": "case.jpg" },
        body
      })
    );
  });
});
