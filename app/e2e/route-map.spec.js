import { test, expect } from "@playwright/test";
test("the affected portion and the original route are both drawn", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("solvik:onboarded", "1");
    localStorage.setItem("solvik:places", JSON.stringify({ version: 2, places: {
      home: { id: "home", name: "Yishun", address: "Yishun", ll: [1.4294, 103.835], source: "onemap", verified: true },
    } }));
    navigator.geolocation.getCurrentPosition = (ok) => ok({ coords: { latitude: 1.4294, longitude: 103.835, accuracy: 12 }, timestamp: Date.now() });
  });
  const geom = [[1.43,103.83],[1.40,103.84],[1.37,103.845],[1.34,103.85],[1.30,103.855]];
  await page.route(u => u.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    let r = {};
    if (path.endsWith("onemap-search")) r = { results: [{ name: "RAFFLES PLACE", address: "Raffles Place", postal: "048616", lat: 1.2841, lng: 103.8515 }] };
    else if (path.endsWith("trip-options")) r = { options: [{ mins: 38, eta: "09:00", fare: "$2.20", fareValue: 2.2, walk: "6 min", walkSecs: 360, transfers: 0, tag: "Fastest", geometry: geom, legSpans: [{ from: 1, to: 3 }], legs: ["NSL"], transitLegs: [{ legIndex: 0, label: "NSL", mode: "RAIL", service: "NS", fromStopCode: "NS13", toStopCode: "NS26" }], steps: [{ legIndex: 0, mode: "RAIL", label: "NSL", secs: 1800, boardStopCode: "NS13", alightStopCode: "NS26" }], note: "Direct" }] };
    else if (path.endsWith("lta") && new URL(route.request().url()).searchParams.get("endpoint") === "TrainServiceAlerts")
      r = { value: { Status: 2, AffectedSegments: [{ Line: "NSL", Direction: "Both", Stations: "NS13,NS17" }], Message: [] } };
    else if (path.endsWith("crowding")) r = { stations: [], slots: [] };
    else if (path.endsWith("forecast")) r = { slots: [], series: {} };
    else if (path.endsWith("planned")) r = { works: [], roadWorks: [], busChanges: [] };
    else if (path.endsWith("weather")) r = { nowcast: null, outlook: null };
    await route.fulfill({ json: r });
  });
  await page.goto("/");
  await page.getByRole("textbox", { name: /Search address/ }).fill("raffles");
  await page.getByRole("button", { name: /^RAFFLES PLACE/ }).click();
  await expect(page.getByText("38", { exact: true }).first()).toBeVisible();

  // Two polylines at minimum: the route, plus the disrupted stretch over it.
  const paths = await page.locator(".leaflet-overlay-pane path").count();
  expect(paths).toBeGreaterThan(1);

});
