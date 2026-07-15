import { expect, type Page } from "@playwright/test";

type SelectorPair = readonly [string, string];

export async function stabilizeVisualPage(page: Page) {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-delay: 0s !important;
        animation-duration: 0.01ms !important;
        caret-color: transparent !important;
        scroll-behavior: auto !important;
        transition-delay: 0s !important;
        transition-duration: 0.01ms !important;
      }
    `
  });
  await page.evaluate(async () => {
    await document.fonts.ready;
    window.scrollTo(0, 0);
  });
}

export async function expectNoUnexpectedOverflow(page: Page, selectors: readonly string[]) {
  const failures = await page.evaluate((targets) => {
    const tolerance = 1;
    const issues: string[] = [];
    const viewportWidth = document.documentElement.clientWidth;

    if (document.documentElement.scrollWidth > viewportWidth + tolerance) {
      issues.push(`document: ${document.documentElement.scrollWidth}px > ${viewportWidth}px`);
      const offenders = Array.from(document.body.querySelectorAll<HTMLElement>("*"))
        .map((element) => ({
          element,
          bounds: element.getBoundingClientRect(),
          style: getComputedStyle(element)
        }))
        .filter(({ bounds, style }) => style.display !== "none" && style.visibility !== "hidden" && bounds.width > 0 && bounds.right > viewportWidth + tolerance)
        .sort((left, right) => right.bounds.right - left.bounds.right)
        .slice(0, 5)
        .map(({ element, bounds }) => `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${element.className && typeof element.className === "string" ? `.${element.className.trim().replace(/\s+/g, ".")}` : ""}: right ${bounds.right.toFixed(1)}px, width ${bounds.width.toFixed(1)}px`);
      issues.push(...offenders);
    }

    for (const selector of targets) {
      for (const [index, element] of Array.from(document.querySelectorAll<HTMLElement>(selector)).entries()) {
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden" || bounds.width === 0 || bounds.height === 0) continue;
        if (element.scrollWidth > element.clientWidth + tolerance && !["auto", "scroll"].includes(style.overflowX)) {
          issues.push(`${selector}[${index}]: ${element.scrollWidth}px > ${element.clientWidth}px (${style.overflowX})`);
        }
      }
    }

    return issues;
  }, [...selectors]);

  expect(failures, "Unexpected horizontal overflow").toEqual([]);
}

export async function expectControlsInsideViewport(page: Page, rootSelector = "body") {
  const failures = await page.locator(rootSelector).evaluate((root) => {
    const tolerance = 1;
    const viewportWidth = document.documentElement.clientWidth;
    return Array.from(root.querySelectorAll<HTMLElement>("button, input, select, textarea, summary, [role='tab']"))
      .filter((element) => {
        const bounds = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return style.display !== "none" && style.visibility !== "hidden" && bounds.width > 0 && bounds.height > 0;
      })
      .flatMap((element) => {
        const bounds = element.getBoundingClientRect();
        if (bounds.left >= -tolerance && bounds.right <= viewportWidth + tolerance) return [];
        let ancestor = element.parentElement;
        while (ancestor && ancestor !== root) {
          const style = getComputedStyle(ancestor);
          const ancestorBounds = ancestor.getBoundingClientRect();
          if (["auto", "scroll"].includes(style.overflowX) && ancestor.scrollWidth > ancestor.clientWidth + tolerance && ancestorBounds.left >= -tolerance && ancestorBounds.right <= viewportWidth + tolerance) {
            return [];
          }
          ancestor = ancestor.parentElement;
        }
        const label = element.getAttribute("aria-label") ?? element.textContent?.trim().slice(0, 40) ?? element.tagName;
        return [`${element.tagName.toLowerCase()} "${label}": ${bounds.left.toFixed(1)}..${bounds.right.toFixed(1)} of ${viewportWidth}`];
      });
  });

  expect(failures, "Interactive controls outside the viewport").toEqual([]);
}

export async function expectRegionsNotOverlapping(page: Page, pairs: readonly SelectorPair[]) {
  const failures = await page.evaluate((selectorPairs) => {
    const rect = (selector: string) => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.display === "none" || style.visibility === "hidden" || bounds.width === 0 || bounds.height === 0 ? null : bounds;
    };

    return selectorPairs.flatMap(([leftSelector, rightSelector]) => {
      const left = rect(leftSelector);
      const right = rect(rightSelector);
      if (!left || !right) return [`missing visible region: ${leftSelector} / ${rightSelector}`];
      const horizontal = Math.min(left.right, right.right) - Math.max(left.left, right.left);
      const vertical = Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top);
      return horizontal > 1 && vertical > 1
        ? [`overlap ${leftSelector} / ${rightSelector}: ${horizontal.toFixed(1)}x${vertical.toFixed(1)}px`]
        : [];
    });
  }, pairs.map(([left, right]) => [left, right] as [string, string]));

  expect(failures, "Critical regions overlap").toEqual([]);
}

export async function expectVisualBaseline(page: Page, name: string, fullPage = false) {
  await stabilizeVisualPage(page);
  await expect(page).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
    fullPage,
    maxDiffPixelRatio: 0.001,
    scale: "css"
  });
}
