import { expect, test } from "../utils/audit-fixture";
import {
  expectAuditPath,
  expectRouteContent,
  gotoAuditPath,
  waitForAuditNavigationToSettle,
} from "../utils/assertions";
import { coreRoutes } from "../utils/routes";

test.describe("desktop navigation", () => {
  test.setTimeout(120_000);

  test("sidebar links route to first-class app pages", async ({ page }) => {
    for (const route of coreRoutes) {
      const startPath = route.path === "/dashboard" ? "/settings" : "/dashboard";
      const startRoute = coreRoutes.find((candidate) => candidate.path === startPath);

      await gotoAuditPath(page, startPath);
      if (startRoute) {
        await expectRouteContent(page, startRoute);
      }

      const link = page.getByRole("link", { name: new RegExp(`^${route.navLabel}$`) }).first();

      await expect(link).toBeVisible();
      await link.click();
      await expectAuditPath(page, route.path);
      await waitForAuditNavigationToSettle(page);
      await expectRouteContent(page, route);
    }
  });
});
