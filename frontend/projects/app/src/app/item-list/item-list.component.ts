import { AfterViewInit, Component, DestroyRef, effect, ElementRef, Input, signal, ViewChild, WritableSignal } from '@angular/core';
import { ApiService } from '../api.service';
import { Observable, take, timer } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlatformService } from '../platform.service';

@Component({
  selector: 'app-item-list',
  imports: [],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.less'
})
export class ItemListComponent implements AfterViewInit{

  expanded = signal(false)

  constructor(public api: ApiService, private destroyRef: DestroyRef, private platform: PlatformService, private el: ElementRef) {
    effect(() => {
      const selectedId = this.api.selectedId();
      timer(10).subscribe(() => {
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
          this.api.mapPaddingBottom.set(height);
        }
      });
    });
  }
}
