import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { clampPan, MAX_ZOOM, PinchZoomDirective, zoomAround } from './pinch-zoom.directive';

describe('zoomAround', () => {
  const rest = { scale: 1, x: 0, y: 0 };

  it('keeps the point under the focus where it is', () => {
    // Content point q shows at x + scale * q. Under focus 40 at rest that is q = 40.
    const zoomed = zoomAround(rest, 2, { x: 40, y: -10 });
    expect(zoomed.x + zoomed.scale * 40).toBeCloseTo(40);
    expect(zoomed.y + zoomed.scale * -10).toBeCloseTo(-10);
    // ...and still, zooming again from an already panned state.
    const q = (40 - zoomed.x) / zoomed.scale;
    const again = zoomAround(zoomed, 3.5, { x: 40, y: -10 });
    expect(again.x + again.scale * q).toBeCloseTo(40);
  });

  it('does not move a photo zoomed about its centre', () => {
    expect(zoomAround(rest, 3, { x: 0, y: 0 })).toEqual({ scale: 3, x: 0, y: 0 });
  });

  it('stays between 1 and the maximum', () => {
    expect(zoomAround(rest, 0.2, { x: 5, y: 5 })).toEqual({ scale: 1, x: 0, y: 0 });
    expect(zoomAround(rest, 99, { x: 0, y: 0 }).scale).toBe(MAX_ZOOM);
  });
});

describe('clampPan', () => {
  const photo = { width: 400, height: 300 };
  const frame = { width: 400, height: 800 };

  it('lets a zoomed photo travel only until its edge meets the frame', () => {
    // 2x: 800 wide in a 400 frame -> 200 of slack either way.
    expect(clampPan({ scale: 2, x: 999, y: 0 }, photo, frame).x).toBe(200);
    expect(clampPan({ scale: 2, x: -999, y: 0 }, photo, frame).x).toBe(-200);
    expect(clampPan({ scale: 2, x: 150, y: 0 }, photo, frame).x).toBe(150);
  });

  it('pins an axis on which the photo is still smaller than the frame', () => {
    // 2x: 600 tall in an 800 frame.
    expect(clampPan({ scale: 2, x: 0, y: 120 }, photo, frame).y).toBe(0);
  });

  describe('for a photo that rests off the centre of its frame', () => {
    const offset = { x: 0, y: 8 };

    it('does not disturb it at rest', () => {
      expect(clampPan({ scale: 1, x: 0, y: 0 }, photo, frame, offset).y).toBe(0);
    });

    it('measures the edges from the frame, not from where the photo rests', () => {
      // 3x: 900 tall in an 800 frame -> the centre may be 50 off the frame's centre, so
      // 42 further down than rest, or 58 further up. Symmetric bounds would leave a strip
      // of backdrop showing on one side.
      expect(clampPan({ scale: 3, x: 0, y: 999 }, photo, frame, offset).y).toBe(42);
      expect(clampPan({ scale: 3, x: 0, y: -999 }, photo, frame, offset).y).toBe(-58);
    });

    it('eases to the centre as it grows to the frame size, with no jump on the way', () => {
      // 800 / 300: exactly frame-sized, so the centre has to be the frame's.
      expect(clampPan({ scale: 800 / 300, x: 0, y: 0 }, photo, frame, offset).y).toBeCloseTo(-8);
      // A hair smaller: within a hair of the same place.
      expect(clampPan({ scale: 798 / 300, x: 0, y: 0 }, photo, frame, offset).y).toBeCloseTo(-7, 0);
      // Well short of the frame it may stay at rest, but not wander past it.
      expect(clampPan({ scale: 2, x: 0, y: 0 }, photo, frame, offset).y).toBe(0);
      expect(clampPan({ scale: 2, x: 0, y: 50 }, photo, frame, offset).y).toBe(0);
      expect(clampPan({ scale: 2, x: 0, y: -50 }, photo, frame, offset).y).toBe(-8);
    });
  });
});

@Component({
  imports: [PinchZoomDirective],
  template: `
    <div style='position: fixed; top: 11px; left: 37px; width: 400px; height: 600px; display: flex; align-items: center; justify-content: center'>
      <div appPinchZoom (zoomedChange)='changes.push($event)' style='width: 400px; height: 300px; flex: none'></div>
    </div>`,
})
class HostComponent {
  changes: boolean[] = [];
}

describe('PinchZoomDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let target: HTMLElement;
  let directive: PinchZoomDirective;

  // Every coordinate in these tests is relative to the frame's top-left corner, where the
  // photo rests centred at (200, 300). Where the frame itself lands in the viewport is not
  // ours to assume — a classic scrollbar gutter moves it, which is what CI has and macOS
  // does not — so the frame is deliberately placed off the corner and measured.
  const CENTRE = { x: 200, y: 300 };
  let origin: { x: number, y: number };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const debug = fixture.debugElement.children[0].children[0];
    target = debug.nativeElement;
    directive = debug.injector.get(PinchZoomDirective);
    const frame = target.parentElement!.getBoundingClientRect();
    origin = { x: frame.left, y: frame.top };
  });

  function touch(type: string, points: [number, number][], changed: [number, number][] = points): TouchEvent {
    const make = ([x, y]: [number, number], identifier: number) =>
      new Touch({ identifier, target, clientX: origin.x + x, clientY: origin.y + y });
    const event = new TouchEvent(type, {
      touches: points.map(make), changedTouches: changed.map(make), cancelable: true, bubbles: true,
    });
    target.dispatchEvent(event);
    return event;
  }

  function pinch(from: [number, number][], to: [number, number][]) {
    touch('touchstart', from);
    const move = touch('touchmove', to);
    touch('touchend', [to[0]], [to[1]]);
    touch('touchend', [], [to[0]]);
    return move;
  }

  function centre() {
    const rect = target.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 - origin.x, y: rect.top + rect.height / 2 - origin.y, width: rect.width };
  }

  it('scales with the distance between two fingers, and claims the gesture', () => {
    const move = pinch([[150, 300], [250, 300]], [[100, 300], [300, 300]]);
    expect(move.defaultPrevented).withContext('or the browser scrolls or page-zooms instead').toBeTrue();
    expect(directive.scale).toBeCloseTo(2);
    expect(centre().width).toBeCloseTo(800);
    expect(fixture.componentInstance.changes).toEqual([true]);
    expect(target.classList).toContain('zoomed');
  });

  it('zooms around the fingers, not around the centre', () => {
    // Pinching open around a point 100px right of centre pushes the photo left.
    pinch([[280, 300], [320, 300]], [[260, 300], [340, 300]]);
    expect(directive.scale).toBeCloseTo(2);
    expect(centre().x).toBeCloseTo(CENTRE.x - 100);
  });

  it('leaves a gesture the browser already owns alone', () => {
    touch('touchstart', [[150, 300], [250, 300]]);
    const make = (x: number, identifier: number) => new Touch({ identifier, target, clientX: origin.x + x, clientY: origin.y + 300 });
    target.dispatchEvent(new TouchEvent('touchmove', { touches: [make(100, 0), make(300, 1)], cancelable: false }));
    expect(directive.scale).toBe(1);
  });

  it('pans with one finger once zoomed, within bounds, and not before', () => {
    touch('touchstart', [[200, 300]]);
    const swipe = touch('touchmove', [[120, 300]]);
    touch('touchend', [], [[120, 300]]);
    expect(swipe.defaultPrevented).withContext('an unzoomed swipe belongs to the track').toBeFalse();
    expect(centre().x).toBeCloseTo(CENTRE.x);

    pinch([[150, 300], [250, 300]], [[100, 300], [300, 300]]);
    touch('touchstart', [[200, 300]]);
    const pan = touch('touchmove', [[260, 300]]);
    expect(pan.defaultPrevented).toBeTrue();
    expect(centre().x).toBeCloseTo(CENTRE.x + 60);
    touch('touchmove', [[900, 300]]);
    expect(centre().x).withContext('800 wide in a 400 frame').toBeCloseTo(CENTRE.x + 200);
  });

  it('snaps back when pinched closed', () => {
    pinch([[150, 300], [250, 300]], [[100, 300], [300, 300]]);
    pinch([[100, 300], [300, 300]], [[190, 300], [210, 300]]);
    expect(directive.scale).toBe(1);
    expect(target.style.transform).toBe('');
    expect(fixture.componentInstance.changes).toEqual([true, false]);
  });

  it('toggles on a double tap, and not on the tail of a pinch', () => {
    const tap = () => { touch('touchstart', [[200, 300]]); return touch('touchend', [], [[200, 300]]); };
    tap();
    expect(directive.scale).toBe(1);
    const second = tap();
    expect(second.defaultPrevented).withContext('or the browser double-tap zooms the page').toBeTrue();
    expect(directive.scale).toBeGreaterThan(1);
    tap(); tap();
    expect(directive.scale).toBe(1);

    pinch([[150, 300], [250, 300]], [[100, 300], [300, 300]]);
    directive.reset();
    tap();
    expect(directive.scale).withContext('one tap after a pinch').toBe(1);
  });

  it('zooms on a trackpad pinch (ctrl + wheel) but leaves a plain wheel alone', () => {
    const at = { clientX: origin.x + 200, clientY: origin.y + 300 };
    const plain = new WheelEvent('wheel', { deltaY: -100, ...at, cancelable: true });
    target.dispatchEvent(plain);
    expect(directive.scale).toBe(1);
    expect(plain.defaultPrevented).toBeFalse();

    const ctrl = new WheelEvent('wheel', { deltaY: -100, ctrlKey: true, ...at, cancelable: true });
    target.dispatchEvent(ctrl);
    expect(directive.scale).toBeGreaterThan(1);
    expect(ctrl.defaultPrevented).toBeTrue();
  });

  it('resets', () => {
    pinch([[150, 300], [250, 300]], [[100, 300], [300, 300]]);
    directive.reset();
    expect(directive.scale).toBe(1);
    expect(fixture.componentInstance.changes).toEqual([true, false]);
  });
});
