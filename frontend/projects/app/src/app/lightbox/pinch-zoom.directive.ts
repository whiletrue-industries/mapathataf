import { Directive, ElementRef, inject, NgZone, OnDestroy, OnInit, output } from '@angular/core';

export const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 300;
const TAP_SLOP = 10;

export type ZoomState = { scale: number, x: number, y: number };
type Point = { x: number, y: number };
type Size = { width: number, height: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Rescales around `focus` so that whatever is under it stays under it. `focus` is relative
 * to the element's resting centre, which is also the transform origin — so a content point
 * q lands at `translate + scale * q`, and holding it still while the scale changes is what
 * the two lines of algebra below do.
 */
export function zoomAround(state: ZoomState, scale: number, focus: Point): ZoomState {
  scale = clamp(scale, 1, MAX_ZOOM);
  const ratio = scale / state.scale;
  return {
    scale,
    x: focus.x - (focus.x - state.x) * ratio,
    y: focus.y - (focus.y - state.y) * ratio,
  };
}

/**
 * Keeps a zoomed element from being dragged so far that the frame shows past its edge.
 *
 * `offset` is how far the element's resting centre is from the frame's centre (the
 * lightbox pads its slides unevenly, so it is not zero). On an axis where the element
 * outgrows the frame it may travel until an edge meets the frame's. Where it is still
 * smaller, it may only sit between its resting place and the frame's centre — which
 * narrows to the centre exactly as it reaches the frame's size, so nothing jumps there.
 */
export function clampPan(state: ZoomState, element: Size, frame: Size, offset: Point = { x: 0, y: 0 }): ZoomState {
  const axis = (translate: number, size: number, frameSize: number, rest: number) => {
    const slack = (size * state.scale - frameSize) / 2;
    const [low, high] = slack >= 0
      ? [-slack, slack]
      : [Math.max(Math.min(0, rest), slack), Math.min(Math.max(0, rest), -slack)];
    // Clamp where the centre ends up relative to the frame's, then back to a translation.
    return clamp(rest + translate, low, high) - rest;
  };
  return {
    scale: state.scale,
    x: axis(state.x, element.width, frame.width, offset.x),
    y: axis(state.y, element.height, frame.height, offset.y),
  };
}

/**
 * Pinch, double-tap, ctrl-wheel (a trackpad pinch) and double-click zoom for an element,
 * with panning while zoomed. The frame it pans within is its parent.
 *
 * Touch is handled with touch events rather than pointer events: a pinch has to be
 * claimed by `preventDefault()` on a non-passive `touchmove`, or the browser takes the
 * two fingers for a scroll of the track (or a page zoom) and cancels the pointers.
 * Everything runs outside the zone and writes the transform straight to the element.
 */
@Directive({
  selector: '[appPinchZoom]',
})
export class PinchZoomDirective implements OnInit, OnDestroy {

  /** Fires when the element enters or leaves the zoomed state. */
  zoomedChange = output<boolean>();

  private element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private zone = inject(NgZone);

  private state: ZoomState = { scale: 1, x: 0, y: 0 };
  private zoomed = false;

  // What the current gesture started from.
  private gesture: { state: ZoomState, distance: number, focus: Point } | null = null;
  private pan: { state: ZoomState, from: Point } | null = null;
  private touchedAt: Point | null = null;
  private moved = false;
  // Stays set until every finger is up, so the tail of a pinch is never read as a tap.
  private pinched = false;
  private lastTap: { time: number, at: Point } | null = null;

  private unlisten: (() => void)[] = [];

  get scale(): number {
    return this.state.scale;
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      const on = <K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void) => {
        this.element.addEventListener(type, handler, { passive: false });
        this.unlisten.push(() => this.element.removeEventListener(type, handler));
      };
      on('touchstart', (event) => this.touchStart(event));
      on('touchmove', (event) => this.touchMove(event));
      on('touchend', (event) => this.touchEnd(event));
      on('touchcancel', (event) => this.touchEnd(event));
      on('wheel', (event) => this.wheel(event));
      on('dblclick', (event) => this.toggle({ x: event.clientX, y: event.clientY }));
      on('pointerdown', (event) => this.mouseDown(event));
      on('pointermove', (event) => this.mouseMove(event));
      on('pointerup', () => this.pan = null);
      on('pointercancel', () => this.pan = null);
      // Safari's own pinch gesture would zoom the page underneath.
      on('gesturestart' as keyof HTMLElementEventMap, (event) => event.preventDefault());
    });
  }

  ngOnDestroy(): void {
    this.unlisten.forEach((unlisten) => unlisten());
  }

  reset(animate = true): void {
    this.apply({ scale: 1, x: 0, y: 0 }, animate);
  }

  // --- touch -----------------------------------------------------------------------------

  private touchStart(event: TouchEvent): void {
    this.moved = false;
    this.touchedAt = this.point(event.touches[0]);
    if (event.touches.length === 2) {
      this.pan = null;
      this.pinched = true;
      this.gesture = {
        state: this.state,
        distance: this.distance(event.touches),
        focus: this.fromCentre(this.midpoint(event.touches)),
      };
    } else if (event.touches.length === 1 && this.zoomed) {
      this.pan = { state: this.state, from: this.point(event.touches[0]) };
    }
  }

  private touchMove(event: TouchEvent): void {
    // Safari reports sub-pixel wobble as movement; a tap has to survive that.
    const at = this.point(event.touches[0]);
    if (!this.touchedAt || Math.hypot(at.x - this.touchedAt.x, at.y - this.touchedAt.y) > TAP_SLOP) {
      this.moved = true;
    }
    if (this.gesture && event.touches.length === 2) {
      // Not cancelable means a scroll is already under way with these fingers; leave it be.
      if (!event.cancelable) {
        this.gesture = null;
        return;
      }
      event.preventDefault();
      const { state, distance, focus } = this.gesture;
      const scaled = zoomAround(state, state.scale * this.distance(event.touches) / distance, focus);
      // The fingers also drag: follow how far their midpoint has travelled.
      const now = this.fromCentre(this.midpoint(event.touches));
      this.apply(this.bounded({ scale: scaled.scale, x: scaled.x + now.x - focus.x, y: scaled.y + now.y - focus.y }));
    } else if (this.pan && event.touches.length === 1) {
      if (event.cancelable) {
        event.preventDefault();
      }
      this.apply(this.bounded({
        scale: this.pan.state.scale,
        x: this.pan.state.x + at.x - this.pan.from.x,
        y: this.pan.state.y + at.y - this.pan.from.y,
      }));
    }
  }

  private touchEnd(event: TouchEvent): void {
    this.gesture = null;
    this.pan = null;
    if (event.touches.length === 1 && this.zoomed) {
      // One finger of a pinch stayed down: carry on as a pan from where it is now.
      this.pan = { state: this.state, from: this.point(event.touches[0]) };
      return;
    }
    if (event.touches.length > 0) {
      return;
    }
    if (this.state.scale < 1.05 && this.zoomed) {
      this.reset();
    }
    const pinched = this.pinched;
    this.pinched = false;
    if (pinched || this.moved || event.type === 'touchcancel') {
      this.lastTap = null;
      return;
    }
    const at = this.point(event.changedTouches[0]);
    const now = Date.now();
    if (this.lastTap && now - this.lastTap.time < DOUBLE_TAP_MS
        && Math.hypot(at.x - this.lastTap.at.x, at.y - this.lastTap.at.y) < TAP_SLOP * 3) {
      this.lastTap = null;
      // Also stops the browser's own double-tap zoom, and the dblclick that would follow.
      event.preventDefault();
      this.toggle(at);
    } else {
      this.lastTap = { time: now, at };
    }
  }

  // --- mouse and trackpad ------------------------------------------------------------------

  private wheel(event: WheelEvent): void {
    // A trackpad pinch arrives as a wheel event with ctrlKey set.
    if (!event.ctrlKey) {
      return;
    }
    event.preventDefault();
    const focus = this.fromCentre({ x: event.clientX, y: event.clientY });
    this.apply(this.bounded(zoomAround(this.state, this.state.scale * Math.exp(-event.deltaY / 100), focus)));
  }

  private mouseDown(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && this.zoomed) {
      event.preventDefault();
      this.element.setPointerCapture(event.pointerId);
      this.pan = { state: this.state, from: { x: event.clientX, y: event.clientY } };
    }
  }

  private mouseMove(event: PointerEvent): void {
    if (event.pointerType === 'mouse' && this.pan) {
      this.apply(this.bounded({
        scale: this.pan.state.scale,
        x: this.pan.state.x + event.clientX - this.pan.from.x,
        y: this.pan.state.y + event.clientY - this.pan.from.y,
      }));
    }
  }

  // --- shared --------------------------------------------------------------------------------

  private toggle(at: Point): void {
    if (this.zoomed) {
      this.reset();
    } else {
      this.apply(this.bounded(zoomAround(this.state, DOUBLE_TAP_ZOOM, this.fromCentre(at))), true);
    }
  }

  private bounded(state: ZoomState): ZoomState {
    const frame = this.element.parentElement;
    if (!frame) {
      return state;
    }
    // The DOM still shows `this.state`, which is what locates the resting centre.
    const rect = this.element.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    return clampPan(
      state,
      // Not offsetWidth/Height: those round, and the error is multiplied by the scale.
      { width: rect.width / this.state.scale, height: rect.height / this.state.scale },
      { width: frameRect.width, height: frameRect.height },
      {
        x: rect.left + rect.width / 2 - this.state.x - (frameRect.left + frameRect.width / 2),
        y: rect.top + rect.height / 2 - this.state.y - (frameRect.top + frameRect.height / 2),
      },
    );
  }

  private apply(state: ZoomState, animate = false): void {
    this.state = state;
    const style = this.element.style;
    style.transition = animate ? '' : 'none';
    style.transform = state.scale === 1 ? '' : `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
    const zoomed = state.scale > 1;
    if (zoomed !== this.zoomed) {
      this.zoomed = zoomed;
      this.element.classList.toggle('zoomed', zoomed);
      this.zone.run(() => this.zoomedChange.emit(zoomed));
    }
  }

  // Viewport coordinates -> relative to the element's resting (untransformed) centre. A
  // scale about the centre leaves the centre where the translation put it, so the resting
  // centre is the current one minus that translation.
  private fromCentre(at: Point): Point {
    const rect = this.element.getBoundingClientRect();
    return {
      x: at.x - (rect.left + rect.width / 2 - this.state.x),
      y: at.y - (rect.top + rect.height / 2 - this.state.y),
    };
  }

  private point(touch: Touch): Point {
    return { x: touch.clientX, y: touch.clientY };
  }

  private midpoint(touches: TouchList): Point {
    return { x: (touches[0].clientX + touches[1].clientX) / 2, y: (touches[0].clientY + touches[1].clientY) / 2 };
  }

  private distance(touches: TouchList): number {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY) || 1;
  }
}
