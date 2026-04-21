import { expect, test } from "../utils/audit-fixture";
import {
  expectAuditRouteUrl,
  expectRouteContent,
  gotoAuditPath,
  waitForAuditNavigationToSettle,
} from "../utils/assertions";
import { appShellRoutes } from "../utils/routes";

test.describe("desktop navigation", () => {
  test("sidebar links route to first-class app pages", async ({ page }) => {
    for (const route of appShellRoutes) {
      const startPath = route.path === "/" ? "/history" : "/";

      await gotoAuditPath(page, startPath);

      const link = page.getByRole("link", { name: new RegExp(`^${route.navLabel}$`) }).first();

      await expect(link).toBeVisible();
      await Promise.all([
        expectAuditRouteUrl(page, route),
        link.click(),
      ]);
      await waitForAuditNavigationToSettle(page);
      await expectRouteContent(page, route);
    }
  });
});
