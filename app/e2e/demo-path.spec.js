import { test, expect } from "@playwright/test";

// The demo, driven the way it is actually used: a cold browser, guest mode,
// onboarding skipped, one tap on the seed button. Every other e2e file here
// pre-seeds localStorage to get straight to the feature under test, which is
// right for those tests and hides the thing this one is for — whether the
// features are reachable at all by someone starting from nothing.
//
// It failed to exist until a question worth asking got asked: how would anyone
// but us ever see this working?
test("every headline feature is reachable from a cold start", async ({ page }) => {
  const missing = [];
  // Several of these land only once a request resolves, so wait rather than
  // sampling — a count() the instant after a click races the render and reports
  // a present feature as absent.
  const need = async (label, locator) => {
    try {
      await locator.first().waitFor({ state: "visible", timeout: 6000 });
    } catch {
      missing.push(label);
    }
  };

  await page.goto("/");
  // No sign-in step: a first visit lands in the app as a guest.
  await page.getByRole("button", { name: /Skip for now/i }).click();
  await page.getByRole("button", { name: "Plan", exact: true }).click();
  await page.waitForTimeout(1500);

  const seed = page.getByRole("button", { name: /sample trips/ });
  await need("the seed button, in a demo build", seed);
  if (await seed.count()) {
    await seed.click();
    await page.waitForTimeout(3000);
  }

  // Proactive: a leave-time, and a crowd level phrased at the feed's own
  // resolution rather than finer.
  await need("a leave-time card", page.getByText(/LEAVE IN|LEAVING NOW|NEXT UP/i));
  // A level when the feed covers the trip, and a reason when it does not. LTA
  // publishes crowding for the current day only, so a demo run in the last
  // half-hour before midnight genuinely has nothing to read — and saying so is
  // the correct behaviour, not a failure. What must never happen is silence.
  await need(
    "a crowd level, or why there isn't one",
    page.getByText(/(Busy|Filling|Moderate|Light) at |crowd forecast for the current day only/),
  );

  // The memory system, and the evidence it shows for its own inference.
  await need("a learned commute with its evidence", page.getByText(/Learned · Seen/));
  await need("the just-added card", page.getByText(/^Added /));
  await need("the trips-remembered count", page.getByText(/trips remembered/));
  await need("places it has noticed", page.getByText(/PLACES IT HAS NOTICED/i));

  // Unplanned, and what LTA has already done about it — the mitigation is
  // quoted from the feed, which is why it carries no timetable caveat.
  await need("a service alert", page.getByText(/NETWORK FORECAST/i));
  await need("the free travel LTA activated", page.getByText(/Free bus boarding|Free MRT shuttle/));
  await need("an alternative way round", page.getByText(/ANOTHER WAY/i));

  // Planned, which the brief calls a differentiator rather than an afterthought.
  await need("lift maintenance on the route", page.getByText(/lifts? out at/i));
  await need("a bus route change ahead of its date", page.getByText(/route changes/i));
  await need("a route around the affected station", page.getByText(/Route around/i));
  await need("weather on the walking legs", page.getByText(/WEATHER ON YOUR WAY/i));

  // Recorded data is never passed off as live.
  await need("recorded data labelled as recorded", page.getByText(/Recorded/));

  // Tailored: the same feed rows have to produce different advice, not just a
  // different label.
  const body = page.locator("body");
  await page.getByRole("button", { name: /Fixed schedule/ }).click();
  await page.waitForTimeout(700);
  const fixed = await body.innerText();
  await page.getByRole("button", { name: /Step-free access/ }).click();
  await page.waitForTimeout(700);
  if ((await body.innerText()) === fixed) missing.push("the advice changes with the persona");
  if ((await page.evaluate(() => document.documentElement.getAttribute("data-text"))) !== "large") {
    missing.push("step-free raises the type scale");
  }

  for (const tab of ["Map", "Report", "Points"]) {
    await page.getByRole("button", { name: tab, exact: true }).click();
    await page.waitForTimeout(1200);
    if ((await body.innerText()).trim().length < 40) missing.push(`the ${tab} tab renders`);
  }

  expect(missing, `not reachable from a cold start: ${missing.join("; ")}`).toEqual([]);
});
