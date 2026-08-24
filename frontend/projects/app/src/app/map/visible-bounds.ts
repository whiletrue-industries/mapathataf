import { Bounds } from '../state.service';

/** The slice of mapboxgl.Map that visibleBounds needs — keeps it testable with a fake. */
export type BoundedMap = {
  getBearing(): number;
  getPitch(): number;
  getBounds(): { toArray(): number[][] } | null;
  getCanvas(): { getBoundingClientRect(): { width: number, height: number } };
  unproject(point: [number, number]): { lng: number, lat: number };
};

function rawBounds(map: BoundedMap): Bounds {
  const [[west, south], [east, north]] = map.getBounds()?.toArray() || [[0, 0], [0, 0]];
  return [west, south, east, north];
}

/**
 * The lng/lat rectangle the user can actually see.
 *
 * `map.getBounds()` reports the whole canvas, including the strip hidden behind the
 * results drawer — so "באיזור המפה" would count facilities nobody can see. Unprojecting
 * the padded corners instead keeps the toggle honest.
 *
 * Falls back to the raw bounds when the map is rotated or pitched (a lng/lat rectangle
 * is meaningless then) or when the canvas has no size yet.
 */
export function visibleBounds(map: BoundedMap, topPad: number, bottomPad: number): Bounds {
  if (map.getBearing() !== 0 || map.getPitch() !== 0) {
    return rawBounds(map);
  }
  const { width, height } = map.getCanvas().getBoundingClientRect();
  const top = Math.max(0, Math.min(topPad, height));
  const bottom = height - Math.max(0, bottomPad);
  if (width <= 0 || bottom - top < 1) {
    return rawBounds(map);
  }
  const near = map.unproject([0, top]);
  const far = map.unproject([width, bottom]);
  return [
    Math.min(near.lng, far.lng),
    Math.min(near.lat, far.lat),
    Math.max(near.lng, far.lng),
    Math.max(near.lat, far.lat),
  ];
}
