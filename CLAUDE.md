# Mapat HaTaf (מפת הטף)

Map of services for ages 0-3, per municipality. Python data pipelines in the repo root
(`data/`, `analyze.ipynb`), Angular workspace in `frontend/`.

## Guidelines

- When a session produces important learnings that would help a future session in this
  project, record them in this file.
- Regularly prune this file to avoid it getting too big - ths is not a documentation file, just pointers to avoid token waste.

## Architecture pointers

- `frontend/` is an Angular 19 workspace with four apps: `landing` (public landing page),
  `app` (the map app), `admin`, `manage` (super-admin console, manage.tafmap.org.il).
  Serve one with `npx ng serve <project> --port <port>` from `frontend/`.
- `manage` auth: Firebase Auth Google sign-in (plain `firebase` SDK, browser-guarded for
  SSR in `auth.service.ts`; web-app config hardcoded in `firebase.ts`), functional route
  guard + Bearer interceptor. Server authorizes against the Firestore
  `settings/superadmins` allowlist; 401/403 on `/manage/workspaces` → access-denied
  screen. Per-city flags `favorite`/`active` are top-level workspace-doc fields;
  `active` (+ logo_url) drives `GET /logos`. `city_links` presence (even empty) is what
  makes a workspace an אשכול — the manage UI keeps empty lists as `[]`, never deletes
  the key. Deploys as a 4th Docker image via production.yml → hasadna-k8s
  (`manageImage`).
- The API server is a Cloud Run service: `https://api-m5crpfzdeq-ez.a.run.app`
  (`BASE_URL` in `frontend/projects/app/src/app/api.service.ts`; also used in the landing
  main component). `/logos` returns per-city logos `{city, id, logo_url}`.
- Logo/asset files live in Firebase storage under
  `https://storage.googleapis.com/mapathataf.firebasestorage.app/logos/`. Missing objects
  return an XML `NoSuchKey` 404, so image URLs from the API are not guaranteed to resolve —
  the landing page drops broken logo images via an `(error)` handler; keep that pattern.
- The site is Hebrew/RTL (`direction: rtl` in `styles.less`). The landing partners-logos
  marquee forces `direction: ltr` internally to keep the translateX animation math simple.
- Location field model (Aug 2026): `official[].address` = raw source address;
  `admin.geocode_address` = admin-amended address or plus code the server geocodes into
  `admin.lat/lng/formatted_address`; `admin.display_address` = display-only override.
  Display resolution in `resolveItem` (`app/src/app/api.service.ts`, tested in its spec):
  `display_address` → `formatted_address` → raw `address`; coords via layer precedence
  user → admin → info → official. Admin geocode-status text lives in
  `admin/src/app/item-edit/location-status.ts`. Server counterpart: mapathataf-server.
- Tests: karma specs per project, `npm run test:ci` (`.github/workflows/tests.yml` runs
  them on PRs); locally `npx ng test <project> --watch=false --browsers=ChromeHeadless`.

## Map app UI (redesigned Aug 2026)

Figma: file `4B5rTzktp58GKIrSqaGa2e` ("Hasadna <> daata (Copy)"), frames in group `6981:2905`.
The original in the `hasadnah` team is rate-limited to 6 MCP calls/month — use the copy.

**`get_design_context` returns code flattened to LTR.** Reproducing its DOM order verbatim
inside `direction: rtl` mirrors every row. Rows whose Figma order is `[content, icon]` need
the icon *first* in the DOM to land on the physical right. This silently mirrored the result
rows, the detail rows and the filters header; compare against an export before believing a
layout is right (see the `figma-diff` skill).

- No header. The map is full-bleed with floating chrome positioned by `main.component.less`:
  `search-bar/` (pill + autocomplete) and `menu/` (round button + slide-down panel). `menu/`
  is a sibling of `.content`, not a child — nested, its fixed panel was trapped in the map
  layer's stacking context and Android painted the sheets over it whatever the z-index said.
- `results-drawer/` and `item-sheet/` are **both always mounted**; the sheet slides over the
  drawer on `.open`. Swapping them with `@if/@else` cost the close animation and reset the
  drawer's `expanded` state on every selection. The sheet keeps the last selection in a
  signal so it still has something to draw on the way out.
- `results-drawer/` is a shell over `results-scope/` (count + `[באיזור המפה | בכל הרשות]`),
  `filter-panel/` and `item-list/`. Only the drawer reports its height to
  `state.mapPaddingBottom`; the map uses it as bottom padding *and* to trim the rectangle for
  map-area scope. The sheet does not, so padding is stale while it is open — a known gap.
- `sections.ts` is the single source of truth for the three categories (label, icon, which
  sub-filters they offer); `filter-defs.ts` owns every filter's options and labels. Adding a
  category or a filter should not need edits anywhere else.
- The category palette is defined **once**, as `--fk-*` custom properties on `:root` in
  `styles.less`. `common.less` aliases them into `@color-fk-*` (plain aliases — LESS colour
  functions cannot operate on `var()`), and `MapComponent.paintSectionColors` reads the same
  properties to repaint the `mh-inactive-aura` pin layer, whose colours are otherwise
  hardcoded to the old palette inside the Mapbox Studio style. Changing a category colour is
  a one-line edit in `styles.less`; Studio needs no change.
- Icons in `public/`: `icon-menu/close/person/share/alert/section-*.svg` come from the Figma
  file, `icon-mi-*.svg` are Material glyphs the design itself uses. Single-tone ones carry
  `fill="currentColor"` and are painted with `.masked-icon()`, whose paths are
  **root-absolute** (`public/` is copied to the output root; a relative `url()` inside an
  imported mixin gets rewritten wrongly). Put the mask on a `::after`, never on an element
  that also needs its own background — the mixin sets `background-color` and would eat it.
  `icon-share`/`icon-alert` are two-tone, so their colours are baked and they are drawn as
  backgrounds; masking would flatten them.
- Motion: one `@ease` (280ms) for everything that opens, closes or resizes, and a
  `prefers-reduced-motion` block in `styles.less` that collapses every duration. Heights
  animate with the `grid-template-rows: 0fr -> 1fr` trick, the only way to transition to a
  content-driven height.

### Two layout invariants that are load-bearing

- **The expanded drawer's height must not depend on the result count.** `.list` takes its
  flex basis from `height`, and `app-item-list` from `0`. Making it content-driven reopens a
  feedback loop: taller drawer -> more map hidden behind it -> fewer results inside the
  viewport -> shorter drawer -> and back, which oscillates whenever a pin sits on the
  visible-area boundary. Every other edge of that loop is wanted; this is the one to cut.
- **`.content` is `overflow: clip`, not `hidden`.** `hidden` is a scroll container, and
  `scrollIntoView` scrolls *every* scrollable ancestor — selecting a result used to scroll the
  whole map layer a few px, leaving a gap under the sheets and knocking the search bar out of
  line with the (fixed, so unaffected) menu button. `item-list` scrolls itself by hand for the
  same reason.

### Filtering and counting rules

- `section` is `'all' | 'education' | 'health' | 'community'`, defaulting to `'all'`.
- `StateService` partitions items **once** into all four groups (`partition()`), applying each
  item's own section's sub-filters. Consequences worth keeping: a chip's count always predicts
  the length of the list you get by clicking it, and no computed that produces counts reads
  `section()`, so flipping a chip re-runs no predicates.
- `groupsViewport` reads `mapScope()` before `mapBounds()` on purpose — dependency tracking is
  dynamic, so panning while scoped to the city invalidates nothing. `mapBounds` is written only
  by `MapComponent` on `moveend` and is never read back to move the camera.
- `map/visible-bounds.ts` trims the viewport by the drawer/search-bar padding; raw
  `getBounds()` would count pins hidden under the sheet as "באיזור המפה".
- Filter signals have **three** states: `null` = never set, `[]` = explicitly emptied, a list =
  a selection. The distinction exists for licensing, which falls back to `DEFAULT_LICENSING`
  via `effectiveLicensing()` when unset — that default shapes מסגרות חינוך but not `הכל`, so
  the headline count is the true total and `הכל` ≠ the sum of the chips while it is in force.
  Clearing it has to record `[]`, or the default just comes back.
- `selectedItem` resolves against `api.items()`, not the filtered list, and `MapComponent`
  always draws the selected pin — a facility reached by search or a shared link must open and
  be findable on the map even when the filters exclude it.
- Search spans the whole city, not the filtered list: matches you can see come first, the rest
  are flagged `outsideFilter` and labelled מחוץ לסינון. Picking one deliberately does *not*
  clear the filters. `searchTerm` itself never filters the list.

### URL fragment grammar

```
<section>[,<scope>]/<lng>/<lat>/<zoom>/<age>/<health>/<community>/<licensing>/<subsidy>/<mentoring>[/<id>]
```

10 or 11 segments; the id is positional-last-and-optional, which is why scope rides on segment
0 instead of taking a segment of its own — an extra segment would make an 11-part fragment
ambiguous between an old link with an id and a new one without. City scope emits no suffix, so
links made in the default scope are byte-identical to pre-redesign ones. A filter segment is
`''` when unset, `-` when explicitly emptied, `;`-joined otherwise. Unknown section/scope
tokens fall back to `all`/`city`. Serialization is the pure `fragment` computed; the effect only
calls `router.navigate`. `MainComponent`'s `route.fragment.pipe(take(1))` must stay in the
constructor — it runs before the first effect flush, so the parse can't be clobbered.

## Landing app specifics

- Landing uses SSR + hydration (`provideClientHydration(withEventReplay())`). Browser-only
  code (fetch, ResizeObserver, DOM measurement) belongs in `afterNextRender`.
- Landing does not provide `HttpClient` — use plain `fetch` for API calls.
- Shared LESS lives in `src/common.less` per project: palette (`@color-night: #053856`,
  `@color-l-nude`, ...), `@mobile-threshold: 1000px`, and `.desktop({...})`/`.mobile({...})`
  media-query mixins.
- Partner/city logos monochrome look: a CSS filter chain
  (`grayscale(1) sepia(1) hue-rotate(165deg) saturate(2.5) contrast(1.05)`) tints images
  toward the navy, and `mix-blend-mode: multiply` on the `.logos` container makes white
  (non-transparent) logo backgrounds disappear into the section background. The blend must
  sit on the container, not the images: the animated track's `transform` creates a stacking
  context that blocks per-image blending.

## Onboarding overlay (app project, Aug 2026)

- `app/src/app/onboarding/` — wizard overlay (welcome → questions → final screen; the
  final screen carries the disclaimer + approval button, titled "מעולה!" if anything was
  answered, "אנחנו על זה!" otherwise). Shows whenever `?onboarding` is present at load
  AND the URL has no hash AND the workspace doc has `onboarding.enabled: true` — there is
  deliberately no once-per-browser localStorage gate. Trigger hooks the
  first-fragment `take(1)` in `main.component.ts` (the hash is populated a tick later by
  the StateService effect, so that is the only place "was there a hash on entry" is
  knowable).
- Per-city content comes from Firestore `c/<slug>.metadata.onboarding` — `GET /{workspaceId}`
  returns the metadata map verbatim (no server code change needed, responses are no-cache).
  Schema: `{enabled, questions: ['age'|'interest'], welcome: {title, intro,
  tagline, prompt}, disclaimer: {text}}` (unknown kinds — e.g. the removed `address`
  question — are filtered out client-side); all texts optional with frontend defaults
  (title defaults to `ברוכים הבאים למפת הטף של <city>`). Live on `dymonh` + `khyph`
  since Aug 2026. The nightly pipeline never overwrites existing workspace metadata, but
  `PUT /{workspace}` replaces the whole metadata map — read-modify-write when scripting
  (the Firebase MCP `firestore_update_document` with `updateMask: metadata.onboarding`
  avoids this).
- On completion the wizard just sets StateService signals (`filterAgeGroup`, `section`);
  the map keeps its default view — map/list/fragment all follow automatically. Skipping the
  interest question leaves `section` at its `'all'` default.

## Testing gotcha

- mapbox-gl's `setRTLTextPlugin` is module-global and throws if called twice; any spec whose
  injector reaches `MapboxService` must stub it:
  `{provide: MapboxService, useValue: {map: null}}`.

## Dev-server gotchas

- **Never run two `ng serve` instances at once.** They share `.angular/cache` and fight over
  the Vite pre-bundle (`There is a new version of the pre-bundle` in the log), which serves
  stale bundles and stale SSR markup for a long time. This caused several false "the fix did
  not work" conclusions in one session.
- Even with one instance, SSR + hydration can reuse stale server-rendered DOM after a
  template edit, so a change appears not to apply however hard you reload. If something looks
  unchanged after an edit, restart the server before believing it — and confirm against the
  served bundle (`curl -s localhost:4200/main.js | grep ...`), not the page.
- HMR (the default) delivers template/style edits as hot patches, so a curl of `main.js` can
  disagree with the page. `--no-hmr` makes the two agree.
- Testing on a phone: `ng serve --host 0.0.0.0 --ssl`. `navigator.share` and
  `navigator.clipboard` exist **only in a secure context**, so over plain http on a LAN IP
  they are silently `undefined` and sharing fails with no error. The self-signed cert needs
  clicking through once on the device.
