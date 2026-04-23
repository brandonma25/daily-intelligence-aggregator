import { expect, test } from "../utils/audit-fixture";

test.describe("mobile navigation", () => {
  test("bottom tabs route to first-class app pages", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const mobileNavigation = page.getByRole("navigation", { name: "Primary" }).last();

    await expect(page.locator('button[aria-controls="mobile-navigation-drawer"]')).toHaveCount(0);
    await expect(mobileNavigation).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: /^Home$/ })).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: /^History$/ })).toBeVisible();
    await expect(mobileNavigation.getByRole("link", { name: /^Account$/ })).toBeVisible();

    await mobileNavigation.getByRole("link", { name: /^History$/ }).click();
    await expect(page).toHaveURL(/\/history$/);
    await expect(page.getByText(/sign in to view briefing history/i)).toBeVisible();

    await page.getByRole("navigation", { name: "Primary" }).last().getByRole("link", { name: /^Account$/ }).click();
    await expect(page).toHaveURL((url) => {
      return url.pathname === "/login" && url.searchParams.get("redirectTo") === "/account";
    });
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });
});
