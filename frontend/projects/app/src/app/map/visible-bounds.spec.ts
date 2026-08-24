import { visibleBounds } from './visible-bounds';

// x/y in canvas pixels -> lng/lat, with a linear projection so the assertions stay readable.
function fakeMap(overrides: any = {}) {
  return {
    getBearing: () => 0,
    getPitch: () => 0,
    getBounds: () => ({ toArray: () => [[34.0, 31.0], [35.0, 32.0]] }),
    getCanvas: () => ({ getBoundingClientRect: () => ({ width: 400, height: 800 }) }),
    unproject: ([x, y]: [number, number]) => ({
      lng: 34.0 + (x / 400),
      lat: 32.0 - (y / 800),
    }),
    ...overrides,
  };
}

describe('visibleBounds', () => {

  it('returns the whole canvas when there is no padding', () => {
    expect(visibleBounds(fakeMap(), 0, 0)).toEqual([34.0, 31.0, 35.0, 32.0]);
  });

  it('excludes the strip hidden behind the results drawer', () => {
    const [, south] = visibleBounds(fakeMap(), 0, 400);
    expect(south).toBeCloseTo(31.5, 6);
    expect(south).toBeGreaterThan(31.0);
  });

  it('excludes the strip behind the floating search bar', () => {
    const [, , , north] = visibleBounds(fakeMap(), 80, 0);
    expect(north).toBeCloseTo(31.9, 6);
    expect(north).toBeLessThan(32.0);
  });

  it('falls back to the raw bounds when the map is rotated', () => {
    const map = fakeMap({ getBearing: () => 45, unproject: () => { throw new Error('should not project'); } });
    expect(visibleBounds(map, 80, 400)).toEqual([34.0, 31.0, 35.0, 32.0]);
  });

  it('falls back to the raw bounds when the map is pitched', () => {
    const map = fakeMap({ getPitch: () => 30, unproject: () => { throw new Error('should not project'); } });
    expect(visibleBounds(map, 80, 400)).toEqual([34.0, 31.0, 35.0, 32.0]);
  });

  it('falls back to the raw bounds when the canvas has no usable area yet', () => {
    const map = fakeMap({ getCanvas: () => ({ getBoundingClientRect: () => ({ width: 0, height: 0 }) }) });
    expect(visibleBounds(map, 80, 400)).toEqual([34.0, 31.0, 35.0, 32.0]);
  });

  it('falls back to the raw bounds when the drawer covers the whole map', () => {
    expect(visibleBounds(fakeMap(), 80, 800)).toEqual([34.0, 31.0, 35.0, 32.0]);
  });
});
