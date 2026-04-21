import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { expect, type Page, type TestInfo } from "@playwright/test";

import type { AuditRoute } from "./routes";

const appCrashPattern =
  /application error|unhandled runtime error|this page could not be found|500 internal server error/i;

export async function expectNoAppCrash(page: Page) {
  await expect(page.locator("body")).not.toContainText(appCrashPattern);
}

export async function expectRouteContent(page: Page, route: AuditRoute) {
  await expectNoAppCrash(page);
  await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
    timeout: 15_000,
  });
}

export async function visitAndAssertRoute(page: Page, route: AuditRoute) {
  const response = await page.goto(route.path, { waitUntil: "domcontentloaded" });

  expect(response, `${route.path} should return a response`).not.toBeNull();
  expect(response?.status(), `${route.path} should load successfully`).toBeLessThan(400);
  await expectRouteContent(page, route);
}

export async function captureAuditScreenshot(
  page: Page,
  testInfo: TestInfo,
  route: AuditRoute,
  prefix = "route",
) {
  const screenshotPath = testInfo.outputPath("screenshots", `${prefix}-${route.slug}.png`);

  await mkdir(dirname(screenshotPath), { recursive: true });
  await page.screenshot({ path: screenshotPath, fullPage: true });
  await testInfo.attach(`${prefix}-${route.slug}`, {
    path: screenshotPath,
    contentType: "image/png",
  });

  return screenshotPath;
}

export async function expectNamedVisibleButtons(page: Page) {
  const unnamedButtons = await page.locator("button:visible").evaluateAll((buttons) =>
    buttons
      .map((button, index) => {
        const label =
          button.getAttribute("aria-label") ??
          button.getAttribute("title") ??
          button.textContent ??
          "";

        return {
          index,
          label: label.trim(),
          html: button.outerHTML.slice(0, 180),
        };
      })
      .filter((button) => button.label.length === 0),
  );

  expect(unnamedButtons).toEqual([]);
}

export async function expectSafeInternalLinks(page: Page) {
  const brokenInternalLinks = await page.locator('a[href^="/"]:visible').evaluateAll((links) =>
    links
      .map((link) => ({
        text: link.textContent?.trim() ?? "",
        href: link.getAttribute("href") ?? "",
      }))
      .filter((link) => !link.href || link.href.startsWith("//")),
  );

  expect(brokenInternalLinks).toEqual([]);
}
