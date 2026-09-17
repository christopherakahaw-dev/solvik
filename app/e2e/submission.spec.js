import { test, expect } from "@playwright/test";

const pageErrors = new WeakMap();
test.beforeEach(async ({ page }) => {
  pageErrors.set(page, []);
  page.on("pageerror", error => pageErrors.get(page).push(error.message));
});
test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page), "No uncaught browser errors").toEqual([]);
});

const home = { id: "home", name: "413 COMMONWEALTH AVENUE WEST SINGAPORE 120413", address: "413 COMMONWEALTH AVENUE WEST SINGAPORE 120413", postal: "120413", ll: [1.311, 103.77], source: "onemap", verified: true };
const school = { id: "school", name: "NANYANG TECHNOLOGICAL UNIVERSITY", address: "50 NANYANG AVENUE SINGAPORE 639798", postal: "639798", ll: [1.348, 103.683], source: "onemap", verified: true };
const bugis = { name: "BUGIS+", address: "201 VICTORIA STREET SINGAPORE 188067", postal: "188067", lat: 1.299, lng: 103.855 };
const destination = { name: "CLEMENTI ARCADE", address: "41 SUNSET WAY CLEMENTI ARCADE SINGAPORE 597071", postal: "597071", lat: 1.323, lng: 103.767 };
const option = { mins: 154, eta: "03:22", fare: "$0.00", walk: "154 min", walkOnly: true, walkSecs: 9240, transfers: 0, tag: "Walking only", geometry: [home.ll, [destination.lat, destination.lng]], legSpans: [{from: 0, to: 1}], transitLegs: [], legs: ["WALK 12.8 km"], steps: [{ mode: "WALK", icon: "flag", title: "Walk to CLEMENTI ARCADE", detail: "12.8 km on foot", metres: 12808, secs: 9240 }], note: "OneMap returned walking only for this departure." };

async function setup(page, places = { home, school }) {
  await page.addInitScript(({ places }) => {
    if (!localStorage.getItem("qa:seeded")) {
      localStorage.setItem("sv-auth:guest-session", "1");
      localStorage.setItem("solvik:onboarded", "1");
      localStorage.setItem("solvik:places", JSON.stringify({ version: 2, places }));
      localStorage.setItem("solvik:searches", JSON.stringify([{ name: "CLARKE QUAY MRT STATION", detail: "10 EU TONG SEN STREET", ll: [1.288, 103.846] }]));
      localStorage.setItem("qa:seeded", "1");
    }
    window.qaLocationCalls = 0;
    navigator.geolocation.getCurrentPosition = (success) => { window.qaLocationCalls++; success({ coords: { latitude: 1.34, longitude: 103.7, accuracy: 15 }, timestamp: Date.now() }); };
    navigator.geolocation.watchPosition = (success) => { success({ coords: { latitude: 1.34, longitude: 103.7, accuracy: 15 }, timestamp: Date.now() }); return 1; };
    navigator.geolocation.clearWatch = () => {};
  }, { places });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().method() === "POST" ? route.request().postDataJSON() : {};
    let response = {};
    if (path.endsWith("onemap-search")) response = { results: /bugis/i.test(body.query) ? [bugis] : /nanyang|^nt/i.test(body.query) ? [{ ...school, lat: school.ll[0], lng: school.ll[1] }] : Array.from({ length: 8 }, (_, i) => ({ ...destination, name: i ? `CLEMENTI PLACE ${i}` : destination.name })) };
    else if (path.endsWith("trip-options")) response = { options: [option] };
    else if (path.endsWith("crowding")) response = { stations: [{ code: "EW24", name: "Jurong East", lat: 1.333, lng: 103.742, level: "moderate" }], slots: [new Date(Date.now() - 1800000).toISOString(), new Date(Date.now() + 1800000).toISOString(), new Date(Date.now() + 3600000).toISOString()] };
    else if (path.endsWith("forecast")) response = { slots: [], series: {} };
    await route.fulfill({ json: response });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Plan", exact: true })).toBeVisible();
}

async function pickDestination(page) {
  await page.getByRole("textbox", { name: "Search address, stop or area", exact: true }).fill("clem");
  await page.getByRole("button", { name: /^CLEMENTI ARCADE/ }).click();
}

async function noOverflow(page) {
  expect(await page.locator(".solvik-app-shell").evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  expect(await page.locator("body").evaluate(el => el.scrollWidth <= window.innerWidth + 1)).toBe(true);
}

test("the account gate remains usable when Supabase is not configured", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  await expect(page.getByText("Account setup is not connected yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true }).last()).toBeDisabled();
  await page.getByRole("tab", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await expect(page.getByRole("button", { name: "Set up in a minute" })).toBeVisible();
  await noOverflow(page);
});

test("map overlays remain separated and search is anchored to the field", async ({ page }, info) => {
  await setup(page);
  const bar = page.locator(".sv-crowd-bar");
  await expect(bar).toBeVisible();
  await expect.poll(async () => {
    const a = await bar.boundingBox(), b = await page.getByRole("button", { name: "Show my location" }).boundingBox();
    return b.y + b.height <= a.y - 6;
  }).toBe(true);
  const nav = await page.getByRole("navigation").boundingBox();
  const crowd = await bar.boundingBox();
  expect(crowd.y + crowd.height).toBeLessThan(nav.y);
  const search = page.getByRole("textbox", { name: "Search address, stop or area", exact: true });
  await search.focus();
  const panel = page.locator(".sv-map-results");
  await expect(panel).toBeVisible();
  const input = await search.boundingBox(), results = await panel.boundingBox();
  expect(results.y - input.y - input.height).toBeLessThan(40);
  await search.fill("clem");
  await expect(page.getByRole("button", { name: /^CLEMENTI ARCADE/ })).toBeVisible();
  const box = await panel.boundingBox();
  expect(box.y + box.height).toBeLessThan(nav.y);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("search.png") });
});

test("places fit small screens, cancel discards edits, and incomplete text cannot be saved", async ({ page }, info) => {
  await setup(page);
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await noOverflow(page);
  for (const card of await page.locator(".sv-saved-grid > button").all()) expect(await card.evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.setViewportSize({ width: 393, height: 420 });
  const dialog = page.getByRole("dialog", { name: "Your places" });
  const field = dialog.getByRole("combobox", { name: "Optional" });
  await field.scrollIntoViewIfNeeded();
  await field.click();
  await field.fill("n");
  const saveBounds = await dialog.getByRole("button", { name: "Save addresses" }).boundingBox();
  expect(saveBounds.y + saveBounds.height).toBeLessThanOrEqual(420);
  await expect(dialog.getByText("Type at least 2 characters to search.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save addresses" })).toBeDisabled();
  await field.fill("nanyang");
  const result = page.getByRole("option").first();
  await expect(result).toBeVisible();
  const pop = await page.getByRole("listbox").boundingBox();
  expect(pop.y).toBeGreaterThanOrEqual(0);
  expect(pop.y + pop.height).toBeLessThanOrEqual(421);
  await page.screenshot({ path: info.outputPath("places-keyboard.png") });
  await result.click();
  await expect(field).toHaveValue(school.name);
  await field.fill("bugis");
  await page.getByRole("option").first().click();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("solvik:places")).places.school.name)).toBe(school.name);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await field.fill("bugis");
  await page.getByRole("option").first().click();
  await dialog.getByRole("button", { name: "Save addresses" }).click();
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("solvik:places")).places.school.name)).toBe("BUGIS+");
});

test("manual commutes keep both endpoints after reload", async ({ page }) => {
  await setup(page, { home });
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await page.getByRole("button", { name: "Add", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add a commute" });
  await expect(dialog.getByRole("button", { name: "Pick places and days" })).toBeDisabled();
  await dialog.getByRole("button", { name: "Search destination", exact: true }).click();
  await dialog.getByRole("textbox", { name: "Search address, stop or area" }).fill("bugis");
  await dialog.getByRole("button", { name: /^BUGIS\+/ }).click();
  await dialog.getByRole("button", { name: "Save commute", exact: true }).click();
  await page.reload();
  const commute = await page.evaluate(() => JSON.parse(localStorage.getItem("solvik:commutes"))[0]);
  expect(commute.fromPlace.ll).toEqual(home.ll);
  expect(commute.toPlace.ll).toEqual([bugis.lat, bugis.lng]);
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(page.getByRole("button", { name: /Home → BUGIS/ })).toBeVisible();
  await noOverflow(page);
});

test("origin search never queries Current location and route selection is private", async ({ page }, info) => {
  await setup(page, {});
  const queries = [], requests = [];
  page.on("request", request => {
    if (request.url().includes("/api/onemap-search")) queries.push(request.postDataJSON().query);
    if (request.url().includes("/api/trip-options")) requests.push(request.postDataJSON());
  });
  await pickDestination(page);
  await expect(page.getByText("Choose a starting place or use your location.")).toBeVisible();
  expect(await page.evaluate(() => window.qaLocationCalls)).toBe(0);
  await page.getByRole("button", { name: "My location", exact: true }).click();
  await expect(page.getByText("From · Current location", { exact: true })).toBeVisible();
  const origin = page.getByRole("combobox", { name: "Search starting place" });
  await origin.fill("unselected");
  await page.getByRole("button", { name: "My location", exact: true }).click();
  await expect(origin).toHaveValue("");
  await expect(page.getByRole("button", { name: "Go", exact: true })).toBeVisible();
  await origin.focus();
  expect(queries).not.toContain("Current location");
  await origin.fill("bugis");
  await page.getByRole("option").first().click();
  await expect.poll(() => requests.at(-1)?.from).toBe("1.299,103.855");
  await expect(page.getByText("From · BUGIS+", { exact: true })).toBeVisible();
  await noOverflow(page);
  await page.getByRole("button", { name: "Go", exact: true }).click();
  await expect(page.getByText("2 h 34 min", { exact: true }).first()).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("navigation.png") });
  await page.getByRole("button", { name: "End trip", exact: true }).last().click();
  await expect(page.getByRole("button", { name: "Go", exact: true })).toBeVisible();
});

test("recorded itineraries cannot start navigation", async ({ page }) => {
  await setup(page);
  await page.route("**/api/trip-options", route => route.fulfill({ json: { recorded: true, options: [{ ...option, recorded: true }] } }));
  await pickDestination(page);
  await expect(page.getByText(/Sample route only/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Preview only" })).toBeDisabled();
});

test("search errors recover and routing failures can be retried", async ({ page }) => {
  await setup(page);
  await page.route("**/api/onemap-search", route => route.fulfill({ status: 502, json: { error: "Search temporarily unavailable" } }));
  const search = page.getByRole("textbox", { name: "Search address, stop or area", exact: true });
  await search.fill("clem");
  await expect(page.getByText("Can't reach OneMap — check your connection")).toBeVisible();
  await page.unroute("**/api/onemap-search");
  await page.route("**/api/trip-options", route => route.fulfill({ status: 502, json: { error: "Routing temporarily unavailable" } }));
  await search.fill("clementi");
  await page.getByRole("button", { name: /^CLEMENTI ARCADE/ }).click();
  await expect(page.getByText("Routing temporarily unavailable")).toBeVisible();
  await expect(page.getByRole("button", { name: "Go", exact: true })).toHaveCount(0);
  await page.unroute("**/api/trip-options");
  await page.getByRole("button", { name: /Try again|Retry/ }).click();
  await expect(page.getByRole("button", { name: "Go", exact: true })).toBeVisible();
  await page.getByText("Hide steps", { exact: true }).click();
  await expect(page.getByText("Show steps", { exact: true })).toBeVisible();
  await page.getByText("Show steps", { exact: true }).click();
  await expect(page.getByText("Hide steps", { exact: true })).toBeVisible();
});

test("denied location still allows a manual origin and unfinished text disables routing", async ({ page }) => {
  await setup(page, {});
  await page.evaluate(() => { navigator.geolocation.getCurrentPosition = (_, fail) => fail({ code: 1 }); });
  await pickDestination(page);
  await page.getByRole("button", { name: "My location", exact: true }).click();
  await expect(page.getByText(/Location permission denied/)).toBeVisible();
  const origin = page.getByRole("combobox", { name: "Search starting place" });
  await origin.fill("bugis");
  await page.getByRole("option").first().click();
  await expect(page.getByRole("button", { name: "Go", exact: true })).toBeVisible();
  await origin.fill("n");
  await expect(page.getByRole("button", { name: "Go", exact: true })).toHaveCount(0);
  await expect(page.getByText("Select a starting place from the search results.")).toBeVisible();
});

test("forecast Now uses live data, not the first forecast interval", async ({ page }) => {
  await setup(page);
  const requests = [];
  page.on("request", request => { if (new URL(request.url()).pathname === "/api/crowding") requests.push(new URL(request.url())); });
  const slots = page.locator(".sv-crowd-bar button");
  await expect(slots.first()).toHaveText("Now");
  await slots.nth(1).click();
  await expect.poll(() => requests.at(-1)?.searchParams.has("at")).toBe(true);
  await slots.first().click();
  await expect.poll(() => requests.at(-1)?.searchParams.has("at")).toBe(false);
});

test("onboarding saves selected places and does not silently accept unfinished addresses", async ({ page }) => {
  await setup(page, {});
  await page.evaluate(() => localStorage.removeItem("solvik:onboarded"));
  await page.reload();
  await page.getByRole("button", { name: "Set up in a minute" }).click();
  await page.getByRole("button", { name: /^Student fares/ }).click();
  await page.getByRole("button", { name: /^Next/ }).click();
  const field = page.getByRole("combobox", { name: "Campus or faculty" });
  await field.scrollIntoViewIfNeeded();
  await field.fill("n");
  await expect(page.getByRole("button", { name: /^Next/ })).toBeDisabled();
  await field.fill("nanyang");
  await page.getByRole("option").first().click();
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: "Start using Solvik" }).click();
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("solvik:places")).places.school.name)).toBe(school.name);
  expect(await page.evaluate(() => window.qaLocationCalls)).toBe(0);
});

test("storage denial does not prevent skipping onboarding or browsing tabs", async ({ page }) => {
  await setup(page);
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException("Blocked", "SecurityError"); };
    Storage.prototype.setItem = () => { throw new DOMException("Blocked", "SecurityError"); };
  });
  await page.reload();
  await page.getByRole("button", { name: "Continue as guest" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();
  for (const name of ["Plan", "Report", "Points", "Map"]) {
    await page.getByRole("navigation").getByRole("button", { name, exact: true }).click();
    await noOverflow(page);
  }
});

test("erase all data removes saved places and local history", async ({ page }) => {
  await setup(page);
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "Erase all data from this device" }).click();
  await expect(page.getByRole("button", { name: "Set up in a minute" })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter(key => key.startsWith("solvik:")))).toEqual([]);
});
