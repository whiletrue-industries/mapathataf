import { afterNextRender, Component, computed, ElementRef, HostListener, inject, OnDestroy, signal, viewChild, viewChildren } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LightboxService } from './lightbox.service';
import { PinchZoomDirective } from './pinch-zoom.directive';

/**
 * Full-viewport photo viewer. The photos sit in a native scroll-snap track, so swiping
 * follows the finger for free; the buttons and the keyboard just scroll that same track,
 * and the current index is only ever derived from where the track has come to rest.
 */
@Component({
  selector: 'app-lightbox',
  imports: [PinchZoomDirective],
  templateUrl: './lightbox.component.html',
  styleUrl: './lightbox.component.less',
  host: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-label': 'תמונות המסגרת',
  },
})
export class LightboxComponent implements OnDestroy {

  lightbox = inject(LightboxService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private document = inject(DOCUMENT);

  private track = viewChild<ElementRef<HTMLElement>>('track');
  private closeButton = viewChild<ElementRef<HTMLElement>>('closeButton');
  private zoomables = viewChildren(PinchZoomDirective);

  photos = computed(() => this.lightbox.content()?.photos || []);
  alt = computed(() => this.lightbox.content()?.alt || '');
  index = signal(this.lightbox.content()?.index || 0);
  // While a photo is zoomed the track is locked, so one finger pans the photo instead of
  // swiping to the next one.
  zoomed = signal(false);

  private opener = this.lightbox.content()?.opener;

  constructor() {
    afterNextRender(() => {
      this.scrollTo(this.index(), false);
      this.closeButton()?.nativeElement.focus();
    });
  }

  ngOnDestroy(): void {
    this.opener?.focus();
  }

  // In RTL the track starts at the right and scrolls towards negative offsets.
  private get direction(): 1 | -1 {
    const track = this.track()?.nativeElement;
    return track && getComputedStyle(track).direction === 'rtl' ? -1 : 1;
  }

  private scrollTo(index: number, animate = true): void {
    const track = this.track()?.nativeElement;
    if (!track) {
      return;
    }
    const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({
      left: this.direction * index * track.clientWidth,
      behavior: animate && !reduced ? 'smooth' : 'instant',
    });
  }

  onScroll(): void {
    const track = this.track()?.nativeElement;
    if (track?.clientWidth) {
      const index = Math.round(Math.abs(track.scrollLeft) / track.clientWidth);
      this.index.set(Math.min(Math.max(index, 0), this.photos().length - 1));
    }
  }

  go(delta: number): void {
    const index = this.index() + delta;
    if (index >= 0 && index < this.photos().length) {
      this.zoomables().forEach((zoomable) => zoomable.reset());
      this.scrollTo(index);
    }
  }

  close(): void {
    this.lightbox.close();
  }

  // A tap on the dark area around a photo dismisses; a tap on the photo itself does not.
  // Nor does anything while zoomed: a mouse pan that is let go off the photo ends in a
  // click on the slide.
  slideClicked(event: MouseEvent): void {
    if (!this.zoomed() && !(event.target instanceof HTMLImageElement)) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        this.close();
        break;
      // The arrows follow the layout: in RTL the next photo is to the left.
      case 'ArrowLeft':
        this.go(-this.direction);
        break;
      case 'ArrowRight':
        this.go(this.direction);
        break;
      case 'Tab':
        this.keepFocusInside(event);
        return;
      default:
        return;
    }
    event.preventDefault();
  }

  private keepFocusInside(event: KeyboardEvent): void {
    const buttons = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('button:not(:disabled)'));
    if (!buttons.length) {
      return;
    }
    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    const active = this.document.activeElement;
    if (!this.host.nativeElement.contains(active)) {
      first.focus();
      event.preventDefault();
    } else if (event.shiftKey && active === first) {
      last.focus();
      event.preventDefault();
    } else if (!event.shiftKey && active === last) {
      first.focus();
      event.preventDefault();
    }
  }
}
