import { expect, test } from "@playwright/test";

test.describe("dashboard", () => {
  test("shows the dashboard loading shell during navigation", async ({ page }) => {
    await page.goto("/topics");

    let delayedOnce = false;
    await page.route("**/dashboard**", async (route) => {
      if (!delayedOnce) {
        delayedOnce = true;
        await page.waitForTimeout(600);
      }
      await route.continue();
    });

    await page.getByRole("link", { name: /today/i }).click();

    await expect(page.getByRole("status", { name: "Loading dashboard" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /loading today's dashboard/i })).toBeVisible();

    await page.waitForURL("**/dashboard");
    await expect(page.getByRole("heading", { name: /today's public briefing/i })).toBeVisible();
  });

  test("renders the signed-out dashboard smoke state", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveTitle(/today's briefing/i);
    await expect(page.getByRole("heading", { name: /today's public briefing/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /what signing in unlocks/i })).toBeVisible();
    await expect(page.getByText(/preview the ranked public briefing here, then sign in/i)).toBeVisible();
  });
});
