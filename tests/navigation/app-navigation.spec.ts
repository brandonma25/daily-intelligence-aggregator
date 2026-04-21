import { expect, test } from "../utils/audit-fixture";
import { expectRouteContent } from "../utils/assertions";
import { coreRoutes } from "../utils/routes";

test.describe("desktop navigation", () => {
  test("sidebar links route to first-class app pages", async ({ page }) => {
    for (const route of coreRoutes) {
      const startPath = route.path === "/dashboard" ? "/settings" : "/dashboard";

      await page.goto(startPath, { waitUntil: "domcontentloaded" });

      const link = page.getByRole("link", { name: new RegExp(`^${route.navLabel}$`) }).first();

      await expect(link).toBeVisible();
      await Promise.all([
        page.waitForURL((url) => url.pathname === route.path),
        link.click(),
      ]);
      await expectRouteContent(page, route);
    }
  });
});
