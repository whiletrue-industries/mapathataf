import { AfterViewInit, Component, computed, DestroyRef, effect, ElementRef, Input, signal, ViewChild, WritableSignal } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable, take, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlatformService } from '../platform.service';
import { StateService } from '../state.service';

@Component({
  selector: 'app-item-list',
  imports: [],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.less'
})
export class ItemListComponent implements AfterViewInit{

  expanded = signal(false)
  initialized = signal(false);

  contactFormLink = computed(() => {
    const item = this.state.selectedItem();
    const workspace = this.api.workspace();
    const facilityName = item?.resolved?.name || '';
    const facilityAddress = item?.resolved?.address || '';
    const facilityCity = workspace?.city || '';
    const facilityKind = item?.resolved?.facility_kind || '';
    const facilitySubKind = item?.resolved?.facility_sub_kind || '';
    const kind = facilityKind + (facilitySubKind ? ` (${facilitySubKind})` : '');
    return `https://www.jotform.com/form/251761121414042?facility_name=${encodeURIComponent(facilityName)}&facility_address=${encodeURIComponent(facilityAddress)}&facility_city=${encodeURIComponent(facilityCity)}&facility_kind=${encodeURIComponent(facilityKind)}`;
  });

  constructor(public api: ApiService, private destroyRef: DestroyRef, private platform: PlatformService, private el: ElementRef, public state: StateService) {
    effect(() => {
      const selectedId = this.state.selectedId();
      const initialized = this.initialized();
      const items = this.state.items();
      if (!initialized || !selectedId || !items || items.length === 0) {
        return;
      }
      timer(0).subscribe(() => {
        this.el?.nativeElement?.querySelector(`[data-id="${selectedId}"]`)?.scrollIntoView({
          behavior: 'smooth',
        });
      });
    });
  }

  ngAfterViewInit() {
    this.platform.browser(() => {
      new Observable<ResizeObserverEntry[]>((observer) => {
        const resize = new ResizeObserver((entries) => {
          observer.next(entries);
        });
        resize.observe(this.el.nativeElement);
        const unsubscribe = () => {
          resize.disconnect();
        };
        return unsubscribe;
      }).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((entries) => {
        const entry = entries[0];
        if (entry) {
          const height = entry.contentRect.height;
          this.state.mapPaddingBottom.set(height);
        }
      });
      this.initialized.set(true);
    });
  }

  async shareRecord() {
    const url = location.href;
    const title = 'מפת הטף';
    await navigator?.share({url});
  }
}
