import { Component, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { ageGroupLabel } from '../age-groups';
import { FILTER_DEFS } from '../filter-defs';

type DetailRow = {
  /** Suffix of an `.icon-*` class in the stylesheet. */
  icon: string;
  label: string;
  value: string;
  href?: string;
};

const OWNER_KIND_LABELS: Record<string, string> = {
  municipal: 'רשת עירונית',
  private: 'מסגרת פרטית',
  national: 'רשת ארצית',
};

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

  /**
   * Built here rather than as a wall of template conditionals: every field is the same
   * icon + "label: value" shape, and which fields exist differs per facility, not per
   * section — which is what the old education/non-education template branches approximated.
   */
  rows = computed<DetailRow[]>(() => {
    const item = this.item();
    if (!item) {
      return [];
    }
    const resolved = item.resolved;
    const rows: DetailRow[] = [];
    const add = (icon: string, label: string, value: string | null | undefined, href?: string) => {
      if (value) {
        rows.push({ icon, label, value, href });
      }
    };

    add('library-books', 'סוג בעלות', OWNER_KIND_LABELS[resolved.owner_kind]);
    add('library-books', 'פרטים נוספים', resolved.more_details);
    add('access-time', 'שעות פעילות', resolved.activity_hours);
    add('library-books', 'סמל מעון', resolved.symbol_text);
    if (resolved.license_status) {
      rows.push({
        icon: 'licensing-' + (resolved.license_status_code || 'none'),
        label: resolved.school_year ? `רישוי (${resolved.school_year})` : 'רישוי',
        value: resolved.license_status,
      });
    }
    add('library-books', 'הדרכת צוות', this.mentoringLabel(resolved.mentoring_type));
    add('person', 'שם מנהל.ת', resolved.manager_name);
    add('person', 'גיל', ageGroupLabel(resolved.age_group));
    add('perm-phone-msg', 'טלפון', resolved.phone, `tel:${resolved.phone}`);
    add('email', 'דוא"ל', resolved.email, `mailto:${resolved.email}`);
    add('link', 'כתובת אתר', resolved.url ? 'קישור למידע נוסף' : '', resolved.url);
    add('location-city', 'כתובת', resolved.address);
    return rows;
  });

  contactFormLink = computed(() => {
    const item = this.item();
    const workspace = this.api.workspace();
    const facilityName = item?.resolved?.name || '';
    const facilityAddress = item?.resolved?.address || '';
    const facilityCity = workspace?.city || '';
    const facilityKind = item?.resolved?.facility_kind || '';
    return `https://www.jotform.com/form/251761121414042?facility_name=${encodeURIComponent(facilityName)}&facility_address=${encodeURIComponent(facilityAddress)}&facility_city=${encodeURIComponent(facilityCity)}&facility_kind=${encodeURIComponent(facilityKind)}`;
  });

  private mentoringLabel(value: string): string | null {
    return FILTER_DEFS.mentoring.options.find((option) => option.value === value)?.label || null;
  }

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
