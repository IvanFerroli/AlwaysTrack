import { describe, expect, it } from "vitest";
import { diagnoseBrowser } from "./browser-diagnostics.js";

describe("browser diagnostics", () => {
  it("recognizes Chrome as the reference browser", () => {
    expect(diagnoseBrowser({ brands: ["Chromium", "Google Chrome"] })).toMatchObject({
      browser: "CHROME", support: "REFERENCE"
    });
  });

  it("recognizes Edge as secondary before its Chromium signature", () => {
    expect(diagnoseBrowser({ userAgent: "Mozilla/5.0 Chrome/126.0 Edg/126.0" })).toMatchObject({
      browser: "EDGE", support: "SECONDARY"
    });
  });

  it("keeps unsupported Chromium variants unknown", () => {
    expect(diagnoseBrowser({ userAgent: "Mozilla/5.0 Chrome/126.0 OPR/112.0" }).browser).toBe("UNKNOWN");
  });

  it("compares opaque profile markers without returning them", () => {
    expect(diagnoseBrowser({ pairedProfileMarker: "work", activeProfileMarker: "work" }).profile).toBe("PAIRED");
    const mismatch = diagnoseBrowser({ pairedProfileMarker: "work", activeProfileMarker: "other" });
    expect(mismatch.profile).toBe("MISMATCH");
    expect(mismatch).not.toHaveProperty("pairedProfileMarker");
    expect(diagnoseBrowser({ pairedProfileMarker: "work" }).profile).toBe("UNKNOWN");
  });
});
