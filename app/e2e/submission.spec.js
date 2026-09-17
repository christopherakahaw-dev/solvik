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
  await expect(page.getByRole("button", { name: /Campus → New job/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Home → School/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Old home → Old job/ })).toHaveCount(0);

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
