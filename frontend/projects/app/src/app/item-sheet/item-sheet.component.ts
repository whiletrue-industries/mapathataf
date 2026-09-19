import { Component, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { itemPhotos } from '../photos';
import { LightboxService } from '../lightbox/lightbox.service';
import { DetailRow, detailRows } from './detail-rows';

@Component({
  selector: 'app-item-sheet',
  imports: [],
  templateUrl: './item-sheet.component.html',
  styleUrl: './item-sheet.component.less'
})
export class ItemSheetComponent {

  state = inject(StateService);
  api = inject(ApiService);
  private document = inject(DOCUMENT);
  private lightbox = inject(LightboxService);

  private static readonly SHARE_LABEL = 'שיתוף רשומה';
  shareLabel = signal(ItemSheetComponent.SHARE_LABEL);

  // Holds on to the last selection so the sheet still has something to draw while it
  // slides out of view.
  private shown = signal<any>(null);
  item = this.shown.asReadonly();

  constructor() {
    effect(() => {
      const selected = this.state.selectedItem();
      if (selected) {
        this.shown.set(selected);
      }
    });
  }

  rows = computed<DetailRow[]>(() => detailRows(this.item()));

  photos = computed(() => itemPhotos(this.item()));

  openPhoto(index: number, opener: EventTarget | null) {
    this.lightbox.open(this.photos(), index, this.item()?.resolved?.name || '', opener as HTMLElement);
  }

  contactFormLink = computed(() => {
    const item = this.item();
    const workspace = this.api.workspace();
    const facilityName = item?.resolved?.name || '';
    const facilityAddress = item?.resolved?.address || '';
    const facilityCity = workspace?.city || '';
    const facilityKind = item?.resolved?.facility_kind || '';
    return `https://www.jotform.com/form/251761121414042?facility_name=${encodeURIComponent(facilityName)}&facility_address=${encodeURIComponent(facilityAddress)}&facility_city=${encodeURIComponent(facilityCity)}&facility_kind=${encodeURIComponent(facilityKind)}`;
  });

  async shareRecord() {
    const url = this.document.location.href;
    // The share sheet is the good path, but it only exists on mobile and only in a secure
    // context — over plain http (a phone on the LAN, say) it is simply absent, and so is
    // the async clipboard, which is why this used to fail silently.
    if (navigator.share) {
      try {
        await navigator.share({ url });
        return;
      } catch {
        return; // the user dismissed the sheet
      }
    }
    this.flash(await this.copyToClipboard(url) ? 'הקישור הועתק' : 'לא ניתן להעתיק את הקישור');
  }

  private async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // fall through to the legacy path
    }
    try {
      const field = this.document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.cssText = 'position:fixed;top:0;opacity:0';
      this.document.body.appendChild(field);
      field.select();
      const copied = this.document.execCommand('copy');
      field.remove();
      return copied;
    } catch {
      return false;
    }
  }

  private flash(message: string) {
    this.shareLabel.set(message);
    setTimeout(() => this.shareLabel.set(ItemSheetComponent.SHARE_LABEL), 2500);
  }
}
