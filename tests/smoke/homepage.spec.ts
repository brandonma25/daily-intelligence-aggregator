import { expect, test } from "../utils/audit-fixture";

test.describe("homepage smoke", () => {
  test("loads the public V1 homepage and opens the full briefing", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: /today's briefing/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Top Events" })).toHaveAttribute("aria-selected", "true");

    const detailLink = page.getByRole("link", { name: "Open full briefing" });

    await expect(detailLink).toBeVisible();
    await detailLink.click();

    await expect(page).toHaveURL(/\/briefing\/\d{4}-\d{2}-\d{2}$/);
    await expect(page.getByRole("link", { name: /back to history/i })).toBeVisible();
  });
});
