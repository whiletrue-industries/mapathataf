# Mapat HaTaf (מפת הטף)

Map of services for ages 0-3, per municipality. Python data pipelines in the repo root
(`data/`, `analyze.ipynb`), Angular workspace in `frontend/`.

## Guidelines

- When a session produces important learnings that would help a future session in this
  project, record them in this file.
- Regularly prune this file to avoid it getting too big - ths is not a documentation file, just pointers to avoid token waste.

## Architecture pointers

- `frontend/` is an Angular 19 workspace with three apps: `landing` (public landing page),
  `app` (the map app), `admin`. Serve one with `npx ng serve <project> --port <port>` from
  `frontend/`.
- The API server is a Cloud Run service: `https://api-m5crpfzdeq-ez.a.run.app`
  (`BASE_URL` in `frontend/projects/app/src/app/api.service.ts`; also used in the landing
  main component). `/logos` returns per-city logos `{city, id, logo_url}`.
- Logo/asset files live in Firebase storage under
  `https://storage.googleapis.com/mapathataf.firebasestorage.app/logos/`. Missing objects
  return an XML `NoSuchKey` 404, so image URLs from the API are not guaranteed to resolve —
  the landing page drops broken logo images via an `(error)` handler; keep that pattern.
- The site is Hebrew/RTL (`direction: rtl` in `styles.less`). The landing partners-logos
  marquee forces `direction: ltr` internally to keep the translateX animation math simple.

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

## Dev-server gotcha

- `ng serve` with HMR (the default) delivers template/style edits as hot "component update"
  patches; fetching `main.js` with curl then shows a stale bundle and can mislead debugging.
  Use `ng serve --no-hmr` when verifying what actually compiled.
