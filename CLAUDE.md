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
  answered, "אנחנו על זה!" otherwise). Shows only when `?onboarding` is present at load
  AND the URL has no hash AND `localStorage['mapathataf-onboarding-done-<workspaceId>']`
  is unset AND the workspace doc has `onboarding.enabled: true`. Trigger hooks the
  first-fragment `take(1)` in `main.component.ts` (the hash is populated a tick later by
  the StateService effect, so that is the only place "was there a hash on entry" is
  knowable).
- Per-city content comes from Firestore `c/<slug>.metadata.onboarding` — `GET /{workspaceId}`
  returns the metadata map verbatim (no server code change needed, responses are no-cache).
  Schema: `{enabled, questions: ['age'|'interest'|'address'], welcome: {title, intro,
  tagline, prompt}, disclaimer: {text}}`; all texts optional with frontend defaults
  (title defaults to `ברוכים הבאים למפת הטף של <city>`). Live on `dymonh` + `khyph`
  since Aug 2026. The nightly pipeline never overwrites existing workspace metadata, but
  `PUT /{workspace}` replaces the whole metadata map — read-modify-write when scripting
  (the Firebase MCP `firestore_update_document` with `updateMask: metadata.onboarding`
  avoids this).
- On completion the wizard just sets StateService signals (`filterAgeGroup`, `section`) and
  `map.flyTo` for the address — map/list/fragment all follow automatically.

## Testing gotcha

- mapbox-gl's `setRTLTextPlugin` is module-global and throws if called twice; any spec whose
  injector reaches `MapboxService` must stub it:
  `{provide: MapboxService, useValue: {map: null}}`.

## Dev-server gotcha

- `ng serve` with HMR (the default) delivers template/style edits as hot "component update"
  patches; fetching `main.js` with curl then shows a stale bundle and can mislead debugging.
  Use `ng serve --no-hmr` when verifying what actually compiled.
