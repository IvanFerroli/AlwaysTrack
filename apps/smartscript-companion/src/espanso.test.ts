import { describe, expect, it } from "vitest";
import { canExportToEspanso, espansoYamlFor } from "./espanso.js";

describe("optional Espanso interoperability", () => {
  it("keeps copy-only as the independent default mode", () => {
    expect(canExportToEspanso("COPY_ONLY")).toBe(false);
    expect(canExportToEspanso("ESPANSO_EXPORT")).toBe(true);
  });

  it("serializes reviewed canonical fields without runtime expansion logic", () => {
    const yaml = espansoYamlFor([{ title: "Status", trigger: ":status", body: "Pedido em separacao" }]);
    expect(yaml).toContain('trigger: ":status"');
    expect(yaml).not.toContain("caseId");
    expect(yaml).not.toContain("activeElement");
  });
});
