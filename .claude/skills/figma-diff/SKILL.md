---
name: figma-diff
description: Check a built screen against its Figma design pixel-for-pixel. Use when implementing a design, or when someone says a screen "doesn't match", is "off", or has wrong spacing, alignment, shadows or direction. Measures rather than eyeballs.
---

# Comparing a built screen to its Figma design

Eyeballing a screenshot next to a design finds the loud differences and misses the ones
people actually report. Normalise both to the same scale and measure.

## 1. Get a reference at a known scale

A PNG the designer exported is best — it is what they are looking at. Otherwise
`mcp__figma__get_screenshot` on the frame. Either way **note the frame width in points**
(this project designs at 430pt) and remember exports are usually @2x.

Figma seat limits bite: a View seat is ~6 MCP calls/month. See `figma-design-file` in
memory for which file to use.

## 2. Normalise both to the frame width

```bash
magick design.png -resize 430x ref.png          # @2x export -> 430pt
```

Capture the app at exactly the same width. With chrome-devtools MCP:
`emulate` with `viewport: "430x932x2,mobile"`, then `take_screenshot` with a `filePath`,
then `magick shot.png -resize 430x cur.png`.

## 3. Look, then measure

Side by side, cropped to the region in question and zoomed:

```bash
magick ref.png -crop 430x290+0+400 +repage -resize 200% a.png
magick cur.png -crop 430x290+0+400 +repage -resize 200% b.png
magick a.png b.png +append cmp.png      # or -append to stack
```

Then get numbers. Ink extents inside a horizontal band tell you where a row actually
starts and ends:

```bash
magick ref.png -crop 430x26+0+494 +repage -fuzz 8% -trim info:   # -> WxH page+X+Y
```

Scan a pixel column to find shadows, separators and section edges:

```bash
for y in $(seq 400 4 660); do magick ref.png -format "%[pixel:p{6,$y}]" info:; echo; done
```

For the live side, read geometry from the page instead — it is exact, and cheaper than
screenshots:

```js
const b = document.querySelector('app-item-list .badge').getBoundingClientRect();
```

Compare the two sets of numbers. A 4px disagreement you would never see is usually the
thing being reported.

## 4. Traps this project has actually hit

- **RTL mirroring.** `get_design_context` returns code flattened to LTR. Reproducing its DOM
  order verbatim under `direction: rtl` mirrors the row. If Figma's order is
  `[content, icon]`, the icon must come *first* in the DOM to sit on the physical right.
  Check icon/badge/chevron sides before anything else.
- **Fixed vs absolute.** An element that looks misaligned by a few px may be fine; something
  else may have moved. Measure both, and check `scrollTop` on positioned ancestors.
- **Shadows.** Sample the pixel column across the boundary rather than trusting a screenshot;
  a `0 4px 24px` shadow reads mostly *above* its element.
- **Stale bundles.** If measurements contradict the source, the dev server is probably serving
  stale SSR markup — restart it (and never run two instances). See CLAUDE.md.
- **Font metrics.** Sizes measured in Inter often read too light in Hebrew; matching the
  number is not the same as matching the weight on screen.

## 5. Report what you changed and what you did not

Designs contain slips — placeholder counts, one row a pixel off, an icon that contradicts the
rest. Say which differences you matched, which you deliberately did not, and why.
