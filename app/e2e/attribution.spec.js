import { test, expect } from "@playwright/test";
test("OpenStreetMap is credited on the map, clear of the tab bar", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("solvik:onboarded", "1");
    localStorage.setItem("solvik:places", JSON.stringify({ version: 2, places: {} }));
  });
  await page.route(u => u.pathname.startsWith("/api/"), r => r.fulfill({ json: { stations: [], slots: [], works: [], groups: [] } }));
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Map", exact: true })).toBeVisible();
  const attr = page.locator(".leaflet-control-attribution").first();
  await expect(attr).toBeVisible();
  await expect(attr).toContainText("OpenStreetMap contributors");
  // In this environment OneMap's tiles are unreachable, so the OSM layer is the
  // one live — which is the layer whose licence requires the credit.
  // Clear of the tab bar: a credit hidden behind a nav bar is not displayed,
  // and ODbL requires it to be shown.
  const lifted = await attr.evaluate(el => getComputedStyle(el.closest(".leaflet-bottom")).bottom);
  expect(parseInt(lifted, 10)).toBeGreaterThan(60);
});
