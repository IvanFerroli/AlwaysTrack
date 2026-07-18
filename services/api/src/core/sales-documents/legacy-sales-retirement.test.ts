import { describe, expect, it, vi } from "vitest";
import { createLegacySalesWriteGuard, legacySalesDeprecationHeaders } from "./legacy-sales-retirement.js";

function responseMock() {
  const response = {
    setHeader: vi.fn(),
    status: vi.fn(),
    json: vi.fn()
  };
  response.status.mockReturnValue(response);
  return response;
}

describe("legacy sales retirement", () => {
  it("advertises deprecation and the SAC successor on historical reads", () => {
    const response = responseMock();
    const next = vi.fn();

    legacySalesDeprecationHeaders({} as never, response as never, next);

    expect(response.setHeader).toHaveBeenCalledWith("Deprecation", "true");
    expect(response.setHeader).toHaveBeenCalledWith("Link", "</v1/support/dashboard>; rel=\"successor-version\"");
    expect(next).toHaveBeenCalledOnce();
  });

  it("freezes writes by default and allows an explicit rollback", () => {
    const response = responseMock();
    const next = vi.fn();

    createLegacySalesWriteGuard({ enableLegacySalesWrites: false })({} as never, response as never, next);
    expect(response.status).toHaveBeenCalledWith(410);
    expect(response.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.objectContaining({ code: "LEGACY_SALES_RETIRED" })
    }));
    expect(next).not.toHaveBeenCalled();

    createLegacySalesWriteGuard({ enableLegacySalesWrites: true })({} as never, response as never, next);
    expect(next).toHaveBeenCalledOnce();
  });
});
