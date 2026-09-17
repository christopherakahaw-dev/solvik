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

async function setup(page, places = { home, school }, options = {}) {
  await page.addInitScript(({ places }) => {
    if (!localStorage.getItem("qa:seeded")) {
      localStorage.setItem("sv-auth:guest-session", "1");
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
    else if (path.endsWith("crowding")) response = { stations: [{ code: "EW24", name: "Jurong East", lat: 1.333, lng: 103.742, level: "moderate" }], slots: (options.crowdOffsets || [-1800000, 1800000, 3600000]).map((offset) => new Date(Date.now() + offset).toISOString()) };
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

test("a first visit reaches the app without being asked to sign in", async ({ page }) => {
  // A credential form as the first paint, on a hosting subdomain with no
  // reputation, is what Safe Browsing's phishing classifier matches on — and it
  // flagged this app for exactly that. Signing in is optional here, so the way
  // in is the app itself.
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Set up in a minute" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Welcome back" })).toHaveCount(0);
  await expect(page.locator('input[type="password"]')).toHaveCount(0);
  await noOverflow(page);
});

test("the account screen is reachable from inside the app, and usable unconfigured", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("button", { name: "Open account" }).click();
  await page.getByRole("button", { name: "Sign in", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
  expect(await page.locator(".sv-auth-screen").evaluate(el => el.scrollWidth <= el.clientWidth + 1), "Auth screen has no horizontal scroll").toBe(true);
  await noOverflow(page);
  await expect(page.getByText("Account setup is not connected yet.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign in", exact: true }).last()).toBeDisabled();
  await page.getByRole("tab", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();

  // Somewhere you go, so there has to be a way back out without signing in.
  await page.getByRole("button", { name: "Back to Solvik" }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
  await noOverflow(page);
});

test("map overlays remain separated and search is anchored to the field", async ({ page }, info) => {
  await setup(page);
  const bar = page.locator(".sv-crowd-bar");
  await expect(bar).toBeHidden();
  await page.getByRole("button", { name: "Crowding layer off" }).click();
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

test("tablet and laptop keep the map full-screen and reveal panels on demand", async ({ page }, info) => {
  await setup(page);

  for (const viewport of [{ width: 768, height: 720 }, { width: 1280, height: 800 }]) {
    await page.setViewportSize(viewport);
    await expect.poll(async () => {
      const shell = await page.locator(".solvik-app-shell--fluid").boundingBox();
      const visibleHeight = await page.evaluate(() => window.visualViewport?.height || window.innerHeight);
      return Math.max(Math.abs(shell.width - viewport.width), Math.abs(shell.height - visibleHeight));
    }).toBeLessThanOrEqual(1);
    await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
    await expect(page.locator(".sv-tab-bar")).toBeHidden();
    const searchBox = await page.locator(".sv-map-search-wrap").boundingBox();
    expect(searchBox.x).toBeGreaterThanOrEqual(117);
    expect(searchBox.x).toBeLessThanOrEqual(120);
    const actionButtons = await page.locator(".sv-map-top-actions > button").all();
    const firstAction = await actionButtons[0].boundingBox(), secondAction = await actionButtons[1].boundingBox();
    expect(Math.abs(firstAction.x - secondAction.x)).toBeLessThanOrEqual(1);
    expect(secondAction.y).toBeGreaterThan(firstAction.y + firstAction.height);
    expect(viewport.width - firstAction.x - firstAction.width).toBeLessThanOrEqual(17);
    await noOverflow(page);
  }

  await page.getByRole("button", { name: "Open menu" }).click();
  const menu = page.getByRole("dialog", { name: "Solvik menu" });
  await expect(menu).toBeVisible();
  expect((await menu.boundingBox()).width).toBeLessThanOrEqual(311);
  await expect(menu.locator(".sv-brand-mark")).toBeVisible();
  const accountTrigger = menu.locator(".sv-menu-account-trigger");
  await expect(accountTrigger).toBeVisible();
  const menuBox = await menu.boundingBox(), accountBox = await accountTrigger.boundingBox();
  expect(menuBox.y + menuBox.height - accountBox.y - accountBox.height).toBeLessThanOrEqual(34);
  await accountTrigger.click();
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await expect(page.locator(".sv-account-page")).toBeVisible();
  await page.screenshot({ path: info.outputPath("account-page.png") });
  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog", { name: "Solvik menu" }).getByRole("button", { name: "Map", exact: true }).click();

  const crowdToggle = page.getByRole("button", { name: "Crowding layer off" });
  await expect(crowdToggle).toBeVisible();
  const pinHint = page.getByText("Tap anywhere to drop a pin");
  await expect(pinHint).toBeVisible();
  const hintBox = await pinHint.boundingBox();
  expect(page.viewportSize().height - hintBox.y - hintBox.height).toBeLessThanOrEqual(36);
  await page.screenshot({ path: info.outputPath("pin-hint.png") });
  await crowdToggle.click();
  await expect(page.getByRole("button", { name: "Crowding layer on" })).toBeVisible();
  await expect(page.locator(".sv-crowd-bar")).toBeVisible();
  await page.getByRole("button", { name: "Crowding layer on" }).click();

  const search = page.getByRole("textbox", { name: "Search address, stop or area", exact: true });
  const topbarBefore = await page.locator(".sv-map-topbar").boundingBox();
  await search.fill("clem");
  const results = page.locator(".sv-map-results");
  await expect(results).toBeVisible();
  expect((await results.boundingBox()).width).toBeLessThanOrEqual(541);
  await page.getByRole("button", { name: /^CLEMENTI ARCADE/ }).click();

  const routeSheet = page.locator(".sv-route-sheet-wrap");
  await expect(routeSheet).toBeVisible();
  expect((await routeSheet.boundingBox()).width).toBeLessThanOrEqual(421);
  const topbarAfter = await page.locator(".sv-map-topbar").boundingBox();
  expect(Math.abs(topbarAfter.x - topbarBefore.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(topbarAfter.width - topbarBefore.width)).toBeLessThanOrEqual(1);
  await expect(page.locator(".sv-route-panel-backdrop")).toHaveCount(0);
  await expect(routeSheet.getByRole("button", { name: "Show steps" })).toBeVisible();
  await expect(routeSheet.getByRole("button", { name: "Hide steps" })).toHaveCount(0);
  const mapCanvas = page.locator(".leaflet-container");
  const mapCenterBefore = await mapCanvas.getAttribute("data-map-center");
  await page.mouse.move(300, 650);
  await page.mouse.down();
  await page.mouse.move(430, 650, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => mapCanvas.getAttribute("data-map-center")).not.toBe(mapCenterBefore);
  await page.screenshot({ path: info.outputPath("route-options-simplified.png") });
  await routeSheet.getByRole("button", { name: "Show steps" }).click();
  await expect(routeSheet.getByRole("button", { name: "Hide steps" })).toBeVisible();
  await expect(routeSheet.locator(".sv-route-mode-primary > button")).toHaveCount(4);
  await expect(routeSheet.getByRole("button", { name: "Cheapest", exact: true })).toHaveCount(0);
  await routeSheet.getByRole("button", { name: "More options", exact: true }).click();
  await expect(routeSheet.getByRole("button", { name: "Cheapest", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Collapse route options" }).last().click();
  const summary = page.locator(".sv-route-summary");
  await expect(summary).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("responsive-map.png") });
});

test("a sparse crowd forecast stays compact on wide screens", async ({ page }, info) => {
  await setup(page, { home, school }, { crowdOffsets: [0] });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.getByRole("button", { name: "Crowding layer off" }).click();
  const crowd = page.locator(".sv-crowd-bar.is-sparse");
  await expect(crowd).toBeVisible();
  const bounds = await crowd.boundingBox();
  expect(bounds.width).toBeLessThan(430);
  expect(bounds.height).toBeLessThan(105);
  await page.screenshot({ path: info.outputPath("compact-crowd-bar.png") });
});

test("desktop content and active navigation use compact responsive layouts", async ({ page }, info) => {
  await setup(page);
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog", { name: "Solvik menu" }).getByRole("button", { name: "Plan", exact: true }).click();
  const plan = page.locator(".sv-plan-screen");
  await expect(plan).toBeVisible();
  await expect(page.locator(".sv-account-card")).toHaveCount(0);
  const planBox = await plan.boundingBox();
  expect(planBox.width).toBeGreaterThan(700);
  expect(planBox.width).toBeLessThanOrEqual(1041);
  await expect(page.locator(".sv-tab-bar")).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeVisible();
  await expect(page.locator(".sv-page-brand")).toBeHidden();
  await expect(page.locator(".sv-page-menu-button .sv-logo-menu-cue")).toBeVisible();
  expect(parseFloat(await page.getByRole("heading", { name: "Today" }).evaluate(el => getComputedStyle(el).fontSize))).toBeLessThanOrEqual(32);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("responsive-plan.png") });

  await page.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("dialog", { name: "Solvik menu" }).getByRole("button", { name: "Map", exact: true }).click();
  await pickDestination(page);
  await expect(page.locator(".sv-route-sheet-wrap")).toBeVisible();
  await page.getByRole("button", { name: "Go", exact: true }).click();
  const instruction = page.locator(".sv-nav-instruction");
  const navSheet = page.locator(".sv-nav-sheet");
  await expect(instruction).toBeVisible();
  await expect(navSheet).toBeVisible();
  expect((await instruction.boundingBox()).width).toBeLessThanOrEqual(411);
  expect((await navSheet.boundingBox()).width).toBeLessThanOrEqual(441);
  expect((await navSheet.boundingBox()).height).toBeLessThanOrEqual(231);
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("responsive-navigation.png") });
});

test("places fit small screens, cancel discards edits, and incomplete text cannot be saved", async ({ page }, info) => {
  await setup(page);
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open menu" })).toBeHidden();
  await expect(page.locator(".sv-page-brand .sv-brand-mark")).toBeHidden();
  await page.screenshot({ path: info.outputPath("mobile-plan-navigation.png") });
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Account", exact: true })).toBeVisible();
  await expect(page.locator(".sv-account-page")).toBeVisible();
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
  await expect(page.getByRole("button", { name: /Edit commute from Home to BUGIS/ })).toBeVisible();
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
  const origin = page.getByRole("combobox", { name: "Search starting place" });
  await expect(origin).toHaveValue("My location");
  await origin.fill("unselected");
  await page.getByRole("button", { name: "My location", exact: true }).click();
  await expect(origin).toHaveValue("My location");
  await expect(page.getByRole("button", { name: "Go", exact: true })).toBeVisible();
  await origin.focus();
  await expect(origin).toHaveValue("");
  expect(queries).not.toContain("Current location");
  await origin.fill("bugis");
  await page.getByRole("option").first().click();
  await expect.poll(() => requests.at(-1)?.from).toBe("1.299,103.855");
  await expect(origin).toHaveValue("BUGIS+");
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
  await expect(page.getByText("Show steps", { exact: true })).toBeVisible();
  await page.getByText("Show steps", { exact: true }).click();
  await expect(page.getByText("Hide steps", { exact: true })).toBeVisible();
  await page.getByText("Hide steps", { exact: true }).click();
  await expect(page.getByText("Show steps", { exact: true })).toBeVisible();
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
  await page.getByRole("button", { name: "Crowding layer off" }).click();
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
  // With storage blocked the guest flag cannot be persisted, so the fallback
  // has to hold the session in memory for the tab rather than bouncing back to
  // a sign-in wall on every render.
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

// A learned commute must not outlive the trips that justified it: the evidence
// ages out at 90 days, so a conclusion drawn from it cannot be permanent.
test("a learned commute whose trips stopped is retired on opening, and says so", async ({ page }) => {
  const DAY = 24 * 60 * 60 * 1000;
  const auto = (sig, from, to, fromName, toName) => ({
    from: `auto-from:${sig}`, to: `auto-to:${sig}`,
    fromPlace: { id: `auto-from:${sig}`, label: fromName, place: "Learned from your trips", ll: from },
    toPlace: { id: `auto-to:${sig}`, label: toName, place: "Learned from your trips", ll: to },
    days: ["Mon", "Tue", "Wed", "Thu", "Fri"], mins: 490, mode: "Comfort", legs: ["EWL"],
    arriveBy: null, source: "auto", signature: sig,
  });
  const journeysFor = (from, to, toName, agoDays) =>
    [0, 1, 2, 3].map((i) => ({
      id: `j${toName}${i}`, at: Date.now() - (agoDays + i) * DAY, fromLL: from, toLL: to,
      toName, mode: "Comfort", legs: ["EWL"], started: true, completed: true,
    }));

  await page.addInitScript(({ auto, oldTrips, freshTrips }) => {
    if (localStorage.getItem("qa:memory")) return;
    localStorage.setItem("solvik:commutes", JSON.stringify(auto));
    localStorage.setItem("solvik:journeys", JSON.stringify(oldTrips.concat(freshTrips)));
    localStorage.setItem("qa:memory", "1");
  }, {
    auto: [
      auto("1.311,103.770>1.299,103.855|weekday", [1.311, 103.77], [1.299, 103.855], "Old home", "Old job"),
      auto("1.348,103.683>1.323,103.767|weekday", [1.348, 103.683], [1.323, 103.767], "Campus", "New job"),
      { from: "home", to: "school", fromPlace: { id: "home", label: "Home", ll: [1.311, 103.77] }, toPlace: { id: "school", label: "School", ll: [1.348, 103.683] }, days: ["Mon"], mins: 480, mode: "Fastest" },
    ],
    oldTrips: journeysFor([1.311, 103.77], [1.299, 103.855], "Old job", 60),
    freshTrips: journeysFor([1.348, 103.683], [1.323, 103.767], "New job", 3),
  });
  await setup(page);

  await expect(page.getByText(/Stopped watching Old home → Old job/)).toBeVisible();
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(page.getByRole("button", { name: /Edit commute from Campus to New job/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Edit commute from Home to School/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Edit commute from Old home to Old job/ })).toHaveCount(0);

  // The retirement is written through, not just hidden for this session.
  await page.reload();
  const kept = await page.evaluate(() => JSON.parse(localStorage.getItem("solvik:commutes")).map((c) => c.toPlace.label));
  expect(kept).toEqual(["New job", "School"]);
  await noOverflow(page);
});

// A disruption on your line should arrive with an answer attached, not just bad
// news. OneMap has no banned-routes parameter, so the alternative is produced by
// filtering — which means the thing to check is that nothing NSL survives it.
const nslOption = { mins: 38, eta: "09:10", fare: "$2.20", fareValue: 2.2, walk: "6 min", walkSecs: 360, transfers: 1, tag: "Fastest", geometry: [[1.43, 103.83], [1.28, 103.85]], legSpans: [{ from: 0, to: 1 }], legs: ["NSL", "EWL"], transitLegs: [{ legIndex: 0, label: "NSL", mode: "RAIL", service: "NS" }, { legIndex: 1, label: "EWL", mode: "RAIL", service: "EW" }], steps: [], note: "1 transfer" };
const busOption = { mins: 52, eta: "09:24", fare: "$2.10", fareValue: 2.1, walk: "9 min", walkSecs: 540, transfers: 1, tag: "Avoids the disruption", geometry: [[1.43, 103.83], [1.28, 103.85]], legSpans: [{ from: 0, to: 1 }], legs: ["BUS 851", "CCL"], transitLegs: [{ legIndex: 0, label: "BUS 851", mode: "BUS", service: "851" }, { legIndex: 1, label: "CCL", mode: "RAIL", service: "CC" }], steps: [], note: "1 transfer" };

async function disruptedCommute(page, { rerouteBody } = {}) {
  await page.addInitScript(({ home, school }) => {
    if (localStorage.getItem("qa:disrupt")) return;
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("solvik:onboarded", "1");
    localStorage.setItem("solvik:places", JSON.stringify({ version: 2, places: {
      home: { id: "home", name: "Home", address: "Home", ll: home, source: "onemap", verified: true },
      school: { id: "school", name: "School", address: "School", ll: school, source: "onemap", verified: true },
    } }));
    localStorage.setItem("solvik:commutes", JSON.stringify([{
      from: "home", to: "school", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], mins: 480, mode: "Comfort", legs: ["NSL"],
      fromPlace: { id: "home", label: "Home", place: "Home", ll: home }, toPlace: { id: "school", label: "School", place: "School", ll: school },
    }]));
    localStorage.setItem("qa:disrupt", "1");
  }, { home: [1.311, 103.77], school: [1.348, 103.683] });

  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    const body = route.request().method() === "POST" ? route.request().postDataJSON() : {};
    const query = new URL(route.request().url()).searchParams;
    let response = {};
    if (path.endsWith("trip-options")) {
      // The reroute is the request that carries `avoid` — answer it the way the
      // server would, with NSL already filtered out.
      response = body.avoid ? (rerouteBody || { mode: "reroute", options: [busOption], avoided: { lines: [body.avoid], dropped: 2, none: false } }) : { options: [nslOption] };
    } else if (path.endsWith("lta") && String(query.get("endpoint")).includes("TrainServiceAlerts")) {
      // DataMall nests the alert object under `value`, and callLta unwraps it.
      response = { value: { Status: 2, AffectedSegments: [{ Line: "NSL", Direction: "Both", StartStation: "NS13", EndStation: "NS17", Stations: "NS13,NS14,NS15,NS16,NS17" }], Message: [{ Content: "NSL - Train fault between Yishun and Bishan. Free bridging buses are available at all affected stations.", CreatedDate: "Now" }] } };
    } else if (path.endsWith("forecast")) response = { slots: [], series: {} };
    else if (path.endsWith("crowding")) response = { stations: [], slots: [] };
    await route.fulfill({ json: response });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Plan", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Plan", exact: true }).click();
}

test("a fault on your line brings an alternative that avoids it", async ({ page }) => {
  await disruptedCommute(page);

  await expect(page.getByText("BUS 851 · CCL", { exact: true })).toBeVisible();
  await expect(page.getByText(/52 min · 14 min longer · avoids NSL entirely/)).toBeVisible();
  // The alternative must never be presented as a live-adjusted time.
  await expect(page.getByText(/timetable, which doesn't know about the disruption/)).toBeVisible();
  // LTA's own bridging-bus text is better information than we can derive.
  await expect(page.getByText(/Free bridging buses/)).toBeVisible();

  // The point of the whole feature: the legs offered are exactly the ones that
  // survived the filter, and the broken line is not among them.
  await expect(page.getByText("BUS 851 · CCL", { exact: true })).toHaveText("BUS 851 · CCL");
  await noOverflow(page);
});

test("when every route still uses the broken line, the app says so", async ({ page }) => {
  // The honest failure: not "no route found", which would be a different claim.
  await disruptedCommute(page, { rerouteBody: { mode: "reroute", options: [], avoided: { lines: ["NSL"], dropped: 4, none: true } } });

  await expect(page.getByText(/No way around NSL right now/)).toBeVisible();
  await expect(page.getByText(/Every route OneMap offers still uses NSL/)).toBeVisible();
  await expect(page.getByText(/timetable, which doesn't know/)).toHaveCount(0);
  await noOverflow(page);
});

test("an alert on a line you never ride offers no reroute", async ({ page }) => {
  await setup(page, { home });
  const planned = [];
  page.on("request", r => { if (r.url().includes("trip-options")) planned.push(r.postDataJSON()); });
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(page.getByText(/Another way/)).toHaveCount(0);
  expect(planned.some(b => b && b.avoid), "no reroute should have been requested").toBe(false);
});

// Two trips somewhere is enough to be told when that line breaks — the point of
// learning places rather than waiting for a full commute to be promoted.
test("two trips to a place is enough to be warned about its line", async ({ page }) => {
  await page.addInitScript(({ office }) => {
    if (localStorage.getItem("qa:places")) return;
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("solvik:onboarded", "1");
    localStorage.setItem("solvik:places", JSON.stringify({ version: 2, places: {} }));
    // Two visits on two days, well under the commute bar of four journeys.
    localStorage.setItem("solvik:journeys", JSON.stringify([1, 3].map((n) => ({
      id: `p${n}`, at: Date.now() - n * 86400000, fromLL: [1.4294, 103.835], toLL: office,
      toName: "The Office", mode: "Comfort", legs: ["NSL"], started: true, completed: true,
    }))));
    localStorage.setItem("qa:places", "1");
  }, { office: [1.3009, 103.8559] });

  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    const query = new URL(route.request().url()).searchParams;
    let response = {};
    if (path.endsWith("lta") && String(query.get("endpoint")).includes("TrainServiceAlerts")) {
      response = { value: { Status: 2, AffectedSegments: [{ Line: "NSL", Direction: "Both", StartStation: "NS13", EndStation: "NS17", Stations: "NS13,NS17" }], Message: [] } };
    } else if (path.endsWith("crowding")) response = { stations: [], slots: [] };
    else if (path.endsWith("forecast")) response = { slots: [], series: {} };
    await route.fulfill({ json: response });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Plan", exact: true })).toBeVisible();

  // No commute was ever promoted — the place alone carries the line.
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("solvik:commutes") || "[]").length)).toBe(0);

  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(page.getByText(/The Office/)).toBeVisible();
  await expect(page.getByText(/2 visits · via NSL/)).toBeVisible();

  // And the alert says which place it affects, not just which line.
  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("button", { name: "Alerts" }).click();
  await expect(page.getByText(/You use this line to get to The Office/)).toBeVisible();
  await noOverflow(page);
});

// Planned works: scheduled, not a fault, and only worth raising when they fall
// on a station your own commute passes through.
// Changes at Bishan — which is what makes a lift there matter. A station the
// train only runs through is deliberately not a warning.
const bishanRoute = { mins: 38, eta: "08:38", fare: "$2.20", fareValue: 2.2, walk: "6 min", walkSecs: 360, transfers: 1, tag: "Fastest", geometry: [[1.43, 103.83], [1.28, 103.85]], legSpans: [{ from: 0, to: 1 }], legs: ["NSL", "CCL"],
  transitLegs: [
    { legIndex: 0, label: "NSL", mode: "RAIL", service: "NS", fromStopCode: "NS13", toStopCode: "NS17" },
    { legIndex: 1, label: "CCL", mode: "RAIL", service: "CC", fromStopCode: "CC15", toStopCode: "CC19" },
  ],
  steps: [
    { legIndex: 0, mode: "RAIL", label: "NSL", secs: 900, from: "Yishun", alight: "Bishan", boardStopCode: "NS13", alightStopCode: "NS17", stopCodes: ["NS15", "NS16"] },
    { legIndex: 1, mode: "RAIL", label: "CCL", secs: 1380, from: "Bishan", alight: "Botanic Gardens", boardStopCode: "CC15", alightStopCode: "CC19", stopCodes: ["CC17"] },
  ],
  note: "1 transfer" };

async function plannedWorks(page, { mode = "Comfort" } = {}) {
  await page.addInitScript(({ mode }) => {
    if (localStorage.getItem("qa:pw")) return;
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("solvik:onboarded", "1");
    localStorage.setItem("solvik:places", JSON.stringify({ version: 2, places: {
      home: { id: "home", name: "Yishun", address: "Yishun", ll: [1.4294, 103.835], source: "onemap", verified: true },
      school: { id: "school", name: "Raffles Place", address: "Raffles Place", ll: [1.2841, 103.8515], source: "onemap", verified: true },
    } }));
    localStorage.setItem("solvik:commutes", JSON.stringify([{
      from: "home", to: "school", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], mins: 480, mode, legs: ["NSL"],
      fromPlace: { id: "home", label: "Yishun", place: "Yishun", ll: [1.4294, 103.835] },
      toPlace: { id: "school", label: "Raffles Place", place: "Raffles Place", ll: [1.2841, 103.8515] },
    }]));
    localStorage.setItem("qa:pw", "1");
  }, { mode });

  const planned = [];
  page.on("request", r => { if (r.url().includes("trip-options")) planned.push(r.postDataJSON()); });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    let response = {};
    if (path.endsWith("trip-options")) response = { options: [bishanRoute] };
    else if (path.endsWith("planned")) response = { works: [{ stationCode: "NS17", stationName: "Bishan", line: "NSL", lifts: [{ id: "B1L01", desc: "Exit B street level to concourse" }] }] };
    else if (path.endsWith("forecast")) response = { slots: [], series: {} };
    else if (path.endsWith("crowding")) response = { stations: [], slots: [] };
    await route.fulfill({ json: response });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Plan", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  return planned;
}

test("a lift out at a station on your way is raised as planned work, not a fault", async ({ page }) => {
  await plannedWorks(page);
  await expect(page.getByText("Planned work")).toBeVisible();
  await expect(page.getByText("Lift out at Bishan")).toBeVisible();
  await expect(page.getByText("Exit B street level to concourse")).toBeVisible();
  // For a commute that isn't step-free this is a note, not a blocked journey.
  await expect(page.getByText(/The trains still run — only the lift is out/)).toBeVisible();
  await noOverflow(page);
});

test("the same lift is a blocked journey when the commute is step-free", async ({ page }) => {
  const planned = await plannedWorks(page, { mode: "Step-free" });
  await expect(page.getByText(/You travel step-free, so this may block the way through/)).toBeVisible();
  // And we do not claim to know how long it will be out — LTA doesn't publish that.
  await expect(page.getByText(/publishes which lift, not how long/)).toBeVisible();

  // Routing around it avoids the station, not the whole line: the trains run.
  await page.getByRole("button", { name: /Route around Bishan/ }).click();
  await expect.poll(() => planned.some(b => b && b.avoidStations === "NS17")).toBe(true);
  expect(planned.some(b => b && b.avoid), "the line itself must not be avoided").toBe(false);
});

test("a lift out somewhere you never go is not mentioned", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("solvik:onboarded", "1");
    localStorage.setItem("solvik:places", JSON.stringify({ version: 2, places: {
      home: { id: "home", name: "Yishun", address: "Yishun", ll: [1.4294, 103.835], source: "onemap", verified: true },
      school: { id: "school", name: "Raffles Place", address: "Raffles Place", ll: [1.2841, 103.8515], source: "onemap", verified: true },
    } }));
    localStorage.setItem("solvik:commutes", JSON.stringify([{
      from: "home", to: "school", days: ["Mon"], mins: 480, mode: "Comfort", legs: ["NSL"],
      fromPlace: { id: "home", label: "Yishun", place: "Yishun", ll: [1.4294, 103.835] },
      toPlace: { id: "school", label: "Raffles Place", place: "Raffles Place", ll: [1.2841, 103.8515] },
    }]));
  });
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    let response = {};
    if (path.endsWith("trip-options")) response = { options: [bishanRoute] };
    // Punggol is nowhere near this commute.
    else if (path.endsWith("planned")) response = { works: [{ stationCode: "PE5", stationName: "Punggol", line: "PLRT", lifts: [{ id: "A1", desc: "Exit A" }] }] };
    else if (path.endsWith("forecast")) response = { slots: [], series: {} };
    else if (path.endsWith("crowding")) response = { stations: [], slots: [] };
    await route.fulfill({ json: response });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await expect(page.getByText(/38 min journey/)).toBeVisible();
  await expect(page.getByText("Planned work")).toHaveCount(0);
});

// Reports: camera-only capture, triage before anything is filed, and points that
// wait on somebody else agreeing.
async function reportFlow(page, { verdict = "accepted" } = {}) {
  await page.addInitScript(() => {
    localStorage.setItem("sv-auth:guest-session", "1");
    localStorage.setItem("solvik:onboarded", "1");
    localStorage.setItem("solvik:places", JSON.stringify({ version: 2, places: {} }));
    // A camera that exists, so getUserMedia resolves the way it would on a phone.
    const canvas = document.createElement("canvas");
    canvas.width = 640; canvas.height = 480;
    const ctx = canvas.getContext("2d");
    // Keep drawing, or captureStream produces no frames and the video never
    // reports dimensions.
    setInterval(() => { ctx.fillStyle = `hsl(${Date.now() % 360},50%,50%)`; ctx.fillRect(0, 0, 640, 480); }, 100);
    // mediaDevices is a prototype getter in Chromium — plain assignment is
    // silently dropped.
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: async () => canvas.captureStream(5) },
    });
    navigator.geolocation.getCurrentPosition = (ok) => ok({ coords: { latitude: 1.3507, longitude: 103.8481, accuracy: 10 }, timestamp: Date.now() });
    navigator.geolocation.watchPosition = (ok) => { ok({ coords: { latitude: 1.3507, longitude: 103.8481, accuracy: 10 }, timestamp: Date.now() }); return 1; };
    navigator.geolocation.clearWatch = () => {};
  });

  const posted = [];
  await page.route(url => url.pathname.startsWith("/api/"), async route => {
    const path = new URL(route.request().url()).pathname;
    let response = {};
    if (path.endsWith("/api/report")) {
      posted.push(route.request().postDataJSON());
      response = verdict === "accepted"
        ? { verdict: "accepted", reason: "Checks passed. It needs another commuter or LTA to confirm it.", points: 25, pointsState: "pending", checks: [{ id: "fresh-fix", ok: true }, { id: "at-the-place", ok: true }], vision: { reason: "The photo shows a lift with a notice." } }
        : { verdict: "rejected", reason: "You appear to be 420 m away. Reports have to be made where the problem is.", points: 0, pointsState: "none", checks: [{ id: "fresh-fix", ok: true }, { id: "at-the-place", ok: false, detail: "You appear to be 420 m away. Reports have to be made where the problem is." }] };
    } else if (path.endsWith("nearest-stop")) response = { code: "53061", name: "Bishan Stn Exit C", road: "Bishan Rd", lat: 1.3507, lng: 103.8485, distanceM: 30 };
    else if (path.endsWith("crowding")) response = { stations: [], slots: [] };
    else if (path.endsWith("forecast")) response = { slots: [], series: {} };
    else if (path.endsWith("planned")) response = { works: [] };
    await route.fulfill({ json: response });
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Report", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Report", exact: true }).click();
  return posted;
}

test("a report cannot be filed from a file, only from the camera", async ({ page }) => {
  await reportFlow(page);
  await page.getByRole("button", { name: /Use location|Recheck/ }).click();
  await page.getByText("Escalator or lift down").click();

  // The one assertion this whole feature rests on: there is no file input to use.
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await expect(page.getByText(/can't be chosen from your files/)).toBeVisible();
  // And the claim that used to sit here, which nothing did, is gone.
  await expect(page.getByText(/Faces are blurred/)).toHaveCount(0);
  await noOverflow(page);
});

test("a filed report earns points that are pending, not credited", async ({ page }) => {
  const posted = await reportFlow(page);
  await page.getByRole("button", { name: /Use location|Recheck/ }).click();
  await page.getByText("Escalator or lift down").click();
  await page.getByRole("button", { name: /Open the camera/ }).click();
  await page.getByRole("button", { name: "Take photo" }).click();
  await page.getByRole("button", { name: /File report/ }).click();

  await expect(page.getByText("Filed", { exact: true })).toBeVisible();
  await expect(page.getByText(/points pending/).first()).toBeVisible();
  await expect(page.getByText(/credited when another commuter reports the same thing, or LTA/)).toBeVisible();
  // Never the word the model cannot support.
  await expect(page.getByText(/verified/i)).toHaveCount(0);

  // The shutter time and the fix travel with the report so the server can judge it.
  expect(posted).toHaveLength(1);
  expect(posted[0].capturedAt).toBeGreaterThan(0);
  expect(posted[0].photo.startsWith("data:image/jpeg;base64,")).toBe(true);
  expect(posted[0].accuracy).toBe(10);
});

test("a rejected report earns nothing and says which check failed", async ({ page }) => {
  await reportFlow(page, { verdict: "rejected" });
  await page.getByRole("button", { name: /Use location|Recheck/ }).click();
  await page.getByText("Escalator or lift down").click();
  await page.getByRole("button", { name: /Open the camera/ }).click();
  await page.getByRole("button", { name: "Take photo" }).click();
  await page.getByRole("button", { name: /File report/ }).click();

  await expect(page.getByText("Not filed").first()).toBeVisible();
  await expect(page.getByText(/420 m away/).first()).toBeVisible();
  await expect(page.getByText(/No points — this report wasn't filed/)).toBeVisible();
  await noOverflow(page);
});
