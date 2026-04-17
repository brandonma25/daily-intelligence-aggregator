import { expect, test } from "@playwright/test";

test("dashboard fixture shows signal labels and ranks higher-signal stories first", async ({ page }) => {
  await page.goto("/dashboard?fixture=importance-ranking");

  await expect(page.getByRole("heading", { name: "Top events today" })).toBeVisible();

  const cards = page.getByTestId("top-events-list").getByTestId("dashboard-event-card");
  await expect(cards).toHaveCount(3);

  await expect(cards.nth(0)).toContainText("High Signal");
  await expect(cards.nth(1)).toContainText("Medium Signal");
  await expect(cards.nth(2)).toContainText("Low Signal");

  await expect(cards.nth(0)).toContainText("Federal Reserve signals emergency liquidity response");
  await expect(cards.nth(1)).toContainText("Intel expands enterprise AI rollout after partner update");
  await expect(cards.nth(2)).toContainText("Analyst commentary revisits startup roadmap");
});
