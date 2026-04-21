import { expect, test } from "../utils/audit-fixture";
import {
  expectNamedVisibleButtons,
  expectNoAppCrash,
  expectSafeInternalLinks,
} from "../utils/assertions";

test.describe("dashboard route", () => {
  test("redirects to the stable V1 Home route", async ({ page }) => {
    await page.goto("/dashboard");

    await expectNoAppCrash(page);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: /today's briefing/i })).toBeVisible();

    await expectNamedVisibleButtons(page);
    await expectSafeInternalLinks(page);
  });
});
