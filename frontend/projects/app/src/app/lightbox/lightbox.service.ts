import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

export type LightboxContent = {
  photos: string[];
  index: number;
  alt: string;
  // Gets the focus back on close. Passed in rather than read from `activeElement`, since
  // Safari does not focus a button that was clicked.
  opener?: HTMLElement;
};

// Marks the history entry that an open lightbox sits on.
const HISTORY_FLAG = 'lightbox';

// The lightbox is mounted once, next to the menu in MainComponent, and opened from here:
// the item sheet is transformed, so a `position: fixed` overlay rendered inside it would be
// sized and clipped by the sheet instead of covering the viewport.
//
// Opening pushes a history entry with the URL left as it is, so the back button (the
// natural way out of a full-screen view on Android) closes the lightbox instead of
// leaving the page. The router sees that popstate too, finds the URL unchanged and does
// nothing; the fragment grammar is not involved.
@Injectable({
  providedIn: 'root'
})
export class LightboxService {
  // null when rendering on the server
  private window = inject(DOCUMENT).defaultView;

  private _content = signal<LightboxContent | null>(null);
  content = this._content.asReadonly();

  constructor() {
    this.window?.addEventListener('popstate', () => this._content.set(null));
  }

  open(photos: string[], index = 0, alt = '', opener?: HTMLElement): void {
    if (!photos.length) {
      return;
    }
    if (!this._content()) {
      const history = this.window?.history;
      // Spread, so the router's own bookkeeping on this entry carries over.
      history?.pushState({ ...history.state, [HISTORY_FLAG]: true }, '');
    }
    this._content.set({ photos, index: Math.min(Math.max(index, 0), photos.length - 1), alt, opener });
  }

  close(): void {
    if (!this._content()) {
      return;
    }
    this._content.set(null);
    // Closed from the inside: take our entry back off the stack, or the next back press
    // would appear to do nothing. If the flag is gone the router has navigated since
    // (the map settling rewrites the fragment) and the top entry is no longer ours.
    const history = this.window?.history;
    if (history?.state?.[HISTORY_FLAG]) {
      history.back();
    }
  }
}
