import { Injectable, signal } from '@angular/core';

export type LightboxContent = {
  photos: string[];
  index: number;
  alt: string;
  // Gets the focus back on close. Passed in rather than read from `activeElement`, since
  // Safari does not focus a button that was clicked.
  opener?: HTMLElement;
};

// The lightbox is mounted once, next to the menu in MainComponent, and opened from here:
// the item sheet is transformed, so a `position: fixed` overlay rendered inside it would be
// sized and clipped by the sheet instead of covering the viewport.
@Injectable({
  providedIn: 'root'
})
export class LightboxService {
  private _content = signal<LightboxContent | null>(null);
  content = this._content.asReadonly();

  open(photos: string[], index = 0, alt = '', opener?: HTMLElement): void {
    if (photos.length) {
      this._content.set({ photos, index: Math.min(Math.max(index, 0), photos.length - 1), alt, opener });
    }
  }

  close(): void {
    this._content.set(null);
  }
}
