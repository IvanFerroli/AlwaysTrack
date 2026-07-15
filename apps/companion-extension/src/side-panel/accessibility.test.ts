import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("./side-panel.css", import.meta.url), "utf8");
const stepperView = readFileSync(new URL("./stepper/stepper-view.ts", import.meta.url), "utf8");
const copyActionsView = readFileSync(new URL("./actions/copy-actions-view.ts", import.meta.url), "utf8");
const interventionView = readFileSync(new URL("./interventions/intervention-view.ts", import.meta.url), "utf8");

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrastRatio(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe("side panel accessibility contract", () => {
  it("has a unique landmark, heading, named controls and programmatic status regions", () => {
    expect(html).toMatch(/<html lang="pt-BR">/);
    expect(html.match(/<main\b/g)).toHaveLength(1);
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/role="progressbar"[^>]+aria-label="Completude do caso"[^>]+aria-valuemin="0"[^>]+aria-valuemax="100"/);
    expect(html).toMatch(/id="browser-diagnostics"[^>]+role="status"[^>]+aria-live="polite"[^>]+aria-atomic="true"/);
    expect(html).toMatch(/id="intervention"[^>]+aria-live="assertive"[^>]+aria-atomic="true"/);
    expect(html).toMatch(/id="plan-update"[^>]+role="status"[^>]+aria-live="polite"[^>]+aria-atomic="true"/);

    const buttons = [...html.matchAll(/<button\b([^>]*)>/g)];
    expect(buttons.length).toBeGreaterThan(0);
    for (const [, attributes] of buttons) expect(attributes).toMatch(/type="button"/);
    for (const id of ["refresh-case", "cancel-case"]) expect(html).toMatch(new RegExp(`id="${id}"[^>]+aria-label="[^"]+"`));

    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const target of [...html.matchAll(/\bfor="([^"]+)"/g)].map((match) => match[1])) expect(ids).toContain(target);
  });

  it("keeps dynamic guidance perceivable and keyboard-focusable", () => {
    expect(stepperView).toContain('options.setAttribute("role", "group")');
    expect(stepperView).toContain('options.setAttribute("aria-label", "Opcoes do passo atual")');
    expect(copyActionsView).toContain('status.setAttribute("role", "status")');
    expect(copyActionsView).toContain('status.setAttribute("aria-atomic", "true")');
    expect(interventionView).toContain('container.setAttribute("role", "alert")');
    expect(interventionView).toContain('container.setAttribute("aria-labelledby", "intervention-title")');
    expect(interventionView).toContain("heading.tabIndex = -1");
    expect(interventionView).toContain("heading.focus()");
  });

  it("defines visible focus, reduced motion and narrow zoom-safe layouts", () => {
    expect(css).toMatch(/button:focus-visible[^\n]+\[tabindex\]:focus-visible[^\n]+outline: 3px solid #0b6bcb/);
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
    expect(css).toMatch(/transition-duration: 0\.01ms !important/);
    expect(css).toMatch(/@media \(max-width: 360px\)[\s\S]+\.copy-actions \{ grid-template-columns: 1fr; \}/);
    expect(css).toMatch(/\.shell \{[^}]+max-width: 600px[^}]+min-height: 100vh/);
    expect(css).toMatch(/overflow-wrap: anywhere/);
  });

  it("keeps critical text and focus colors above WCAG AA/non-text thresholds", () => {
    expect(contrastRatio("#ffffff", "#165da8")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#17202a", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#a51d16", "#ffffff")).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio("#0b6bcb", "#ffffff")).toBeGreaterThanOrEqual(3);
  });
});
