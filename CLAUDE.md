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

- No header. The map is full-bleed with floating chrome positioned by `main.component.less`:
  `search-bar/` (pill + autocomplete, and the selected-item state with a `‹` back button),
  `menu/` (round hamburger + slide-down panel), and the city logo.
- Bottom sheet slot holds **either** `results-drawer/` **or** `item-sheet/`, switched on
  `state.selectedId()` — the two never co-exist. `results-drawer/` is a shell over
  `results-scope/` (count + `[באיזור המפה | בכל הרשות]`), `filter-panel/` (category chips,
  sub-filter pills, active-filter chips) and `item-list/` (badge + name rows). Whichever
  sheet is open must keep writing its height to `state.mapPaddingBottom`: the map uses it as
  bottom padding *and* to trim the viewport rectangle for map-area scope.
- `sections.ts` is the single source of truth for the three categories (label, icon, which
  sub-filters they offer); `filter-defs.ts` owns every filter's options and labels. Adding a
  category or a filter should not need edits anywhere else. Colours live in `common.less` as
  `@color-fk-*` + `-border`, applied through the `.section-palette()` mixin.
- The category palette is defined **once**, as `--fk-*` custom properties on `:root` in
  `styles.less`. `common.less` aliases them into `@color-fk-*` (plain aliases — LESS colour
  functions cannot operate on `var()`), and `MapComponent.paintSectionColors` reads the same
  properties to repaint the `mh-inactive-aura` pin layer, whose colours are otherwise
  hardcoded to the old palette inside the Mapbox Studio style. Changing a category colour is
  a one-line edit in `styles.less`; Studio needs no change.
- Icons: `public/icon-mi-*.svg` are Material glyphs and `icon-section-*.svg` the category
  badges, all authored with `fill="currentColor"` and painted via the `.masked-icon()` mixin.
  Its paths are **root-absolute** (`/icon-mi-close.svg`) because `public/` is copied to the
  output root and a relative `url()` inside an imported mixin gets rewritten wrongly. Put the
  mask on a `::after`, never on an element that also needs its own background — the mixin
  sets `background-color: currentColor` and would eat it.

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
- The licensing default (`valid/in_progress/not_needed`) is a *fallback* in
  `effectiveLicensing()`, not a value written into `filterLicensing`. It shapes מסגרות חינוך
  but not `הכל`, so the headline count is the true total and `הכל` ≠ the sum of the three
  chips while licensing is untouched. Clearing it writes every licensing value explicitly
  (`clearFilter`), otherwise the default would just come back.
- `selectedItem` resolves against `api.items()`, not the filtered list — a deep link to a
  filtered-out item must still open, and this also cuts a `selectedItem → flyTo → moveend →
  mapBounds → items` feedback edge.
- `searchTerm` deliberately does not filter the list; it only drives the autocomplete.

### URL fragment grammar

```
<section>[,<scope>]/<lng>/<lat>/<zoom>/<age>/<health>/<community>/<licensing>/<subsidy>/<mentoring>[/<id>]
```

10 or 11 segments; the id is positional-last-and-optional, which is why scope rides on segment
0 instead of taking a segment of its own — an extra segment would make an 11-part fragment
ambiguous between an old link with an id and a new one without. City scope emits no suffix, so
links made in the default scope are byte-identical to pre-redesign ones. Unknown section/scope
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

## Dev-server gotcha

- `ng serve` with HMR (the default) delivers template/style edits as hot "component update"
  patches; fetching `main.js` with curl then shows a stale bundle and can mislead debugging.
  Use `ng serve --no-hmr` when verifying what actually compiled.
