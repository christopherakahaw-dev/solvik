# Solvik Design System

Solvik is a smart commuter companion app for Singapore. It answers three questions for a
person standing on a pavement: *where am I and what's the next move* (Map), *what is
coming and how full is it* (Live), and *what does my day require of me* (Plan). It blends
live LTA DataMall arrival + crowding data with the user's own calendar, and nudges them
with leave-by times.

The product is deliberately quiet: warm paper backgrounds, one green, big legible
numbers, and no decoration that isn't data. Organised, easy to navigate, calm under
pressure — because it is read one-handed, in a hurry, often outdoors.

## Sources this system was built from

| Source | What it gave us |
| --- | --- |
| `uploads/Screenshot 2026-09-13 103506.png` | Map screen — place header, step-free toggle, Routes CTA, tile map with dotted green route, floating trip sheet, bottom nav |
| `uploads/Screenshot 2026-09-13 103302.png` | Live screen — screen header with data provenance, All/Train/Bus filters, crowding legend + meter, service status, arrivals cards |
| `uploads/Screenshot 2026-09-13 103338.png` | Plan screen — Today header, calendar connect prompt, trip cards with leave-by times and attribute tags |
| Brand note from the team | "Warm green palette, simple but nice UI animations, organised and easy-to-navigate pages" |

**No codebase, Figma file, font binaries, logo, or slide template were supplied.** Every
value in `tokens/` was sampled from the screenshots pixel-by-pixel; everything else is a
faithful reconstruction of the patterns visible in them. Where the source is silent (route
results, onboarding, settings) this system says so rather than inventing a screen.

---

## Content fundamentals

**Voice.** Solvik talks like a local who checks the app for you and tells you the one thing
you need. Short declaratives. No filler, no hype, no apology.

**Person.** Mostly impersonal — the UI states facts about the world ("Normal service on all
lines", "3 trips"). Where the app acts on the user's behalf it uses the imperative, never
"we": "Connect Google Calendar", "Start trip", "Pull meetings in, get leave-by nudges".
"You" is implied, rarely written. Never "I".

**Casing.** Sentence case everywhere — titles ("Live arrivals", "Next planned trip"), buttons
("Start trip", "Connect"), tags authored in sentence case and rendered uppercase by the
component. Two exceptions: uppercase micro-labels ("CROWDING NOW · NORTH SOUTH LINE",
"STEP-FREE") and uppercase place names resolved from a data source, which are printed
exactly as the source returns them, brackets and all — "NANYANG TECHNOLOGICAL UNIVERSITY
( HALL OF RESIDENCE 13)". Don't tidy those; the odd spacing is the data's honesty.

**Length.** Headers are 1–3 words. Subtitles are one line with `·` separators and always
carry either a count, a date, or provenance: "Fri 12 Sep · 3 trips", "Near Bishan (NS17) ·
LTA DataMall". Benefit lines are one clause and a comma: "Pull meetings in, get leave-by
nudges".

**Numbers and time.** 24-hour clock with a colon — "09:30", "14:00". Leave-by times appear
under the word "Leave" on their own line. Durations are "8 min", "~6 min" (tilde for
estimates). The big arrival numeral drops the unit entirely; the follow-up carries it.

**Separators.** Middot `·` joins facts of the same weight. Arrow `→` joins origin and
destination: "Bishan → Toa Payoh · Bus 130". Never "to", never an en dash for routes.

**Crowding and status.** Plain words only — Light, Moderate, Busy; "Normal service on all
lines". Never percentages, never "Level 2", never a raw API status.

**Emoji.** None. Not in UI, not in notifications, not in empty states. Exclamation marks
are not used either.

**Sample copy set**
- `Live arrivals` / `Near Bishan (NS17) · LTA DataMall`
- `Today` / `Fri 12 Sep · 3 trips`
- `Connect Google Calendar` / `Pull meetings in, get leave-by nudges` / `Connect`
- `09:30` `Next planned trip` `Fastest · ~6 min` `Start trip`
- `Hospital follow-up` / `Bishan → Tan Tock Seng · NSL` / `STEP-FREE`
- Avoid: `You're all set! 🎉`, `Optimising your multimodal journey`, `ERROR_NO_ARRIVALS`

---

## Visual foundations

### Colour
One green does all the work. `--green-600` `#437858` is the accent: filled CTAs, the active
filter pill, the notification dot, the route line, positive service text. `--green-100`
`#eff5f0` (mint) is its soft counterpart: inactive filters, attribute tags, the active
bottom-nav capsule. Everything else is warm neutral — the page is `#f4f3f1`, cards are pure
white, ink is `#201e1d` (a warm near-black, never `#000`), secondary text `#71736f`. There
are no greys with a blue cast anywhere in the system.

Signal colour is reserved for crowding and disruption: mint `#bfd7c7` light, amber `#d5983b`
moderate, rust `#a76121` busy, berry `#b03a4a` for faults. Colour is never the only signal —
every meter is followed by the word.

Maximum two background colours per surface: warm paper plus white cards. No gradients
anywhere. No colour is used decoratively.

### Type
Single family, `Archivo` (see caveat below), five weights. Display and titles are 800/700
with negative tracking (−0.022em to −0.012em) — dense and confident. Body is 400 at 17px.
The only tracked-out type is the uppercase micro-label at 13px/0.13em. Numerals are always
tabular so times and minutes stack in a column. Headlines wrap with `text-wrap: pretty`
and never truncate — long place names run to two lines rather than ellipsing (the sheet's
secondary label is the one exception, where a `…` is allowed).

### Layout
A single-column, 440px-max phone canvas with a 16px gutter. Content is a vertical stack of
cards separated by 14px. The header is a white band with a hairline bottom; the bottom nav
floats 14px off every edge as a pill rather than sitting flush. Nothing is fixed except the
header and the nav. Grouping is done by card, never by rule lines or headings alone.

### Cards and borders
White, 26px radius, 20px padding, soft two-layer shadow, and *no* border by default. A
border appears only when it means something: a mint `--border-accent` hairline marks a trip
that needs attention. Hairlines inside a card (row dividers) are 1px `--border-card`. Controls
use a sand hairline. Nothing in the system has a coloured left border.

### Shadows and transparency
Four shadows, all warm-black at 4–12% opacity and heavily blurred: `card` (rest), `raised`
(hover), `nav` (floating bottom bar), `sheet` (upward-cast, for the map sheet). No inner
shadows. Transparency is used only for shadow colour and the focus ring; there is no
frosted glass, no scrim over content except the map sheet's own shadow, and no protection
gradients — the sheet is opaque white, which is why it reads over any map tile.

### Radii
6 / 10 / 14 / 20 / 26 / 32px, plus the pill. Every interactive control is a full pill —
buttons, filters, tags, badges, toggles, the search field, the nav. Containers are 26px
(card) or 32px (sheet). Squares and small radii appear only inside dense data rows.

### Motion
Simple, short, and never bouncy. Standard ease is `cubic-bezier(.2,.7,.3,1)`; entrances use
`cubic-bezier(.16,1,.3,1)`. Hover/colour transitions 150ms, layout and capsule slides 220ms,
data colour changes 340ms, the map sheet's rise-and-fade 420ms. The bottom-nav mint capsule
*slides* between tabs — it never cross-fades. Crowding colours cross-fade, they never fill
like a progress bar. Sheets rise 14px while fading in. No parallax, no spring overshoot on
anything the user reads. All durations collapse to zero under `prefers-reduced-motion`.

### Interaction states
- **Hover** — filled controls darken one step (`--accent` → `--accent-hover`); soft controls
  go one mint step deeper; cards lift 1px and swap `shadow-card` for `shadow-raised`.
- **Press** — scale 0.972 plus the flattened `shadow-press`. No colour flash.
- **Focus** — 3px green ring at 28% (`--ring-focus`) plus a green border; visible on keyboard only.
- **Disabled** — sand fill `--sand-200`, subtle text, `not-allowed`. Never a faded green.
- **Selected** — green fill for a filter, mint capsule for a nav tab, mint border for a card.

### Imagery
There is no photography or illustration in the product. The only full-bleed surface is the
map: OpenStreetMap raster tiles pushed warm and desaturated (`saturate(.72) sepia(.12)`) so
the green route and the ink position dot stay the loudest things on screen. The route is a
dotted green polyline; the user's position is a solid ink dot with a white ring. Water is
the one cool colour in the whole system.

---

## Iconography

- **Set:** Lucide 0.460 outline icons, 24px box, 2px stroke, round caps and joins,
  `currentColor` fill-less strokes. **This is a substitution** — the screenshots show a
  2px outline set (bell, calendar, lock, arrow) with no icon assets provided; Lucide is the
  closest CDN-available match in stroke weight and corner treatment. Swap it for the real
  set when the files exist.
- **Delivery:** CDN — `https://unpkg.com/lucide@0.460.0/dist/umd/lucide.js`. No icon font,
  no sprite sheet, no PNG icons. Nothing is bundled into `assets/`.
- **Wrapper:** always render through the `Icon` component so size, stroke and colour stay
  consistent; never paste raw SVG into a screen.
- **Sizes:** 14px inside tags, 16–18px in buttons, 20px in icon buttons, 24–28px in prompt
  cards and headers.
- **Density:** icons are rare. Navigation and filters are text-only. An icon appears only
  where it carries meaning that a word would carry worse (accessibility lock, calendar,
  rain, directional arrow).
- **Emoji and unicode:** no emoji, ever. Two unicode characters are load-bearing typography,
  not icons: `→` in route lines and `·` as a separator. `~` prefixes estimates.

## Brand marks

**No logo file was supplied.** Nothing has been drawn or approximated. Wherever a mark
belongs, set the word *Solvik* in Archivo 800 with −0.035em tracking — see
`guidelines/wordmark.card.html` for the three approved placeholder lockups (ink on paper,
white on green pill, green uppercase). `assets/` is intentionally empty of marks; please
send the real logo.

---

## Intentional additions

Two components have no direct counterpart in the three screenshots and were added because
the kit is unusable without them. Both are flagged so nobody mistakes them for observed design:

- **`SearchField`** — route planning needs text entry; built strictly from existing pill,
  hairline and focus-ring rules.
- **`Icon`** — a wrapper around the substituted Lucide set, so the substitution can be
  swapped in one place.

## Known gaps

Not present in the source and therefore **not designed**: route results / journey options
(the "Routes" button leads nowhere here), turn-by-turn navigation, onboarding, sign-in,
settings, notifications list, empty and error states, dark mode, tablet and web surfaces.

---

## Index

| Path | What it is |
| --- | --- |
| `styles.css` | Entry point — `@import`s every token file. Consumers link this only. |
| `tokens/` | `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `elevation.css`, `motion.css`, `base.css` |
| `guidelines/` | 22 foundation specimen cards (Colors, Type, Spacing, Brand) |
| `components/` | React primitives, grouped by concern — see below |
| `ui_kits/solvik-app/` | Click-through recreation of the three product surfaces |
| `assets/` | Empty — no logo or icon assets were supplied |
| `thumbnail.html` | Homepage tile |
| `SKILL.md` | Agent Skills wrapper so this system can be used from Claude Code |

### Components

| Group | Components |
| --- | --- |
| `components/core/` | **Button**, **IconButton**, **Card**, **CardDivider**, **Badge**, **Tag**, **TogglePill**, **Icon** |
| `components/forms/` | **SearchField** |
| `components/navigation/` | **AppHeader**, **SegmentedTabs**, **TabBar** |
| `components/transit/` | **ArrivalRow**, **CrowdingMeter**, **CrowdingLegend**, **TripCard**, **PromptCard**, **ServiceStatus**, **SectionLabel** |
| `components/map/` | **MapCanvas**, **BottomSheet**, **SheetKeyframes** |

Each directory holds `<Name>.jsx`, `<Name>.d.ts`, `<Name>.prompt.md` and one `@dsCard`
HTML showing its states.

### UI kit

`ui_kits/solvik-app/` — Map, Live and Plan as one interactive shell (`index.html`): the
bottom nav switches surfaces, the All/Train/Bus filter narrows the arrivals list, the
step-free toggle holds, and connecting the calendar dismisses the prompt.

---

## Caveats for the team

1. **Fonts.** No binaries were supplied. Archivo (Google Fonts) is loaded by `@import` in
   `tokens/fonts.css` as the nearest match to the screenshots' grotesque. Send the real
   font files and this becomes local `@font-face` rules.
2. **Icons.** Lucide substituted for the real 2px outline set (see ICONOGRAPHY).
3. **Logo.** Absent by design — placeholder wordmark only.
4. **Map tiles.** OpenStreetMap through Leaflet, warm-filtered by CSS. The production app
   appears to use a Singapore basemap (OneMap-style); swap the tile URL when known.
