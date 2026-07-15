import { expect } from "vitest";

function accessibleName(element: Element): string {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim();
  }
  return (element.getAttribute("aria-label") ?? element.getAttribute("title") ?? element.textContent ?? "").trim();
}

function hasLabel(control: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): boolean {
  if (accessibleName(control)) return true;
  if (control.labels?.length) return true;
  return Boolean(control.closest("label"));
}

export function expectNoCriticalAccessibilityViolations(container: HTMLElement): void {
  const violations: string[] = [];
  const ids = new Set<string>();

  for (const element of container.querySelectorAll<HTMLElement>("[id]")) {
    if (ids.has(element.id)) violations.push(`duplicate id: ${element.id}`);
    ids.add(element.id);
  }

  for (const element of container.querySelectorAll<HTMLElement>("button, a[href], [role='tab'], [role='menuitem']")) {
    if (!accessibleName(element)) violations.push(`unnamed interactive element: ${element.outerHTML}`);
  }

  for (const control of container.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input, select, textarea")) {
    if (control.type !== "hidden" && !hasLabel(control)) violations.push(`unlabelled form control: ${control.outerHTML}`);
  }

  for (const image of container.querySelectorAll<HTMLImageElement>("img")) {
    if (!image.hasAttribute("alt")) violations.push(`image without alt: ${image.outerHTML}`);
  }

  for (const table of container.querySelectorAll<HTMLTableElement>("table")) {
    if (!accessibleName(table) && !table.querySelector("caption")) violations.push("table without accessible name");
    for (const header of table.querySelectorAll("th")) {
      if (!header.hasAttribute("scope")) violations.push(`table header without scope: ${header.textContent}`);
    }
  }

  for (const tablist of container.querySelectorAll<HTMLElement>("[role='tablist']")) {
    const tabs = Array.from(tablist.querySelectorAll<HTMLElement>("[role='tab']"));
    if (tabs.filter((tab) => tab.getAttribute("aria-selected") === "true").length !== 1) violations.push("tablist must have one selected tab");
    for (const tab of tabs) {
      if (!tab.hasAttribute("aria-controls")) violations.push(`tab without aria-controls: ${accessibleName(tab)}`);
      if (tab.getAttribute("aria-selected") === "true" && tab.tabIndex !== 0) violations.push(`selected tab outside tab order: ${accessibleName(tab)}`);
      if (tab.getAttribute("aria-selected") === "false" && tab.tabIndex !== -1) violations.push(`inactive tab inside tab order: ${accessibleName(tab)}`);
    }
  }

  for (const element of container.querySelectorAll<HTMLElement>("[aria-controls]")) {
    const controls = element.getAttribute("aria-controls");
    const isActive = element.getAttribute("aria-expanded") === "true" || element.getAttribute("aria-selected") === "true";
    if (controls && isActive && !document.getElementById(controls)) violations.push(`active control targets missing element: ${controls}`);
  }

  expect(violations, violations.join("\n")).toEqual([]);
}

function luminance(hex: string): number {
  const channels = hex.match(/[a-f\d]{2}/gi)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}
