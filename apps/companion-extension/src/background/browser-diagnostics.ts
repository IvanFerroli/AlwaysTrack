export type BrowserFamily = "CHROME" | "EDGE" | "UNKNOWN";
export type WorkProfileState = "PAIRED" | "MISMATCH" | "UNKNOWN";

export interface BrowserDiagnosticsInput {
  userAgent?: string;
  brands?: readonly string[];
  pairedProfileMarker?: string;
  activeProfileMarker?: string;
}

export interface BrowserDiagnostics {
  browser: BrowserFamily;
  profile: WorkProfileState;
  support: "REFERENCE" | "SECONDARY" | "UNKNOWN";
}

export function diagnoseBrowser(input: BrowserDiagnosticsInput): BrowserDiagnostics {
  const brands = (input.brands ?? []).join(" ");
  const signature = `${brands} ${input.userAgent ?? ""}`;
  const browser = /Edg\//i.test(signature) || /Microsoft Edge/i.test(signature)
    ? "EDGE"
    : /Google Chrome/i.test(brands) || (/Chrome\//i.test(signature) && !/OPR\//i.test(signature))
      ? "CHROME"
      : "UNKNOWN";

  const hasBothMarkers = Boolean(input.pairedProfileMarker && input.activeProfileMarker);
  const profile = !hasBothMarkers
    ? "UNKNOWN"
    : input.pairedProfileMarker === input.activeProfileMarker
      ? "PAIRED"
      : "MISMATCH";

  return {
    browser,
    profile,
    support: browser === "CHROME" ? "REFERENCE" : browser === "EDGE" ? "SECONDARY" : "UNKNOWN"
  };
}

export function diagnoseCurrentBrowser(): BrowserDiagnostics {
  const navigatorWithBrands = navigator as Navigator & { userAgentData?: { brands?: Array<{ brand: string }> } };
  return diagnoseBrowser({
    userAgent: navigator.userAgent,
    brands: navigatorWithBrands.userAgentData?.brands?.map(({ brand }) => brand)
  });
}
