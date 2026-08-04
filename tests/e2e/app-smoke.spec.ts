import { expect, test } from "@playwright/test";
import { loginAsAdminPage, openPrimaryNavigationItem } from "./helpers";

test.describe("AlwaysTrack app smoke", () => {
  test("admin can log in and navigate core support areas", async ({ page }) => {
    await loginAsAdminPage(page);

    const sections = [
      ["SAC", "Avisos"], ["SAC", "Fluxos"], ["SAC", "Scriptoteca"], ["SAC", "Wiki"], ["SAC", "FAQ"],
      ["Administração", "Usuários/Times"]
    ] as const;
    for (const [group, section] of sections) {
      await openPrimaryNavigationItem(page, new RegExp(`^${group}`), new RegExp(`^${section}$`));
      await expect(page.getByRole("heading", { name: section, exact: true })).toBeVisible();
    }

    await openPrimaryNavigationItem(page, /^SAC/, /^Scriptoteca$/);
    await expect(page.getByRole("heading", { name: "Roteiros" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Copiar script|Copiar passo/i }).first()).toBeVisible();
  });
});
