import { AfterViewInit, Component, DestroyRef, ElementRef, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PlatformService } from '../platform.service';
import { StateService } from '../state.service';
import { ResultsScopeComponent } from './results-scope/results-scope.component';
import { FilterPanelComponent } from './filter-panel/filter-panel.component';
import { ItemListComponent } from './item-list/item-list.component';

@Component({
  selector: 'app-results-drawer',
  imports: [ResultsScopeComponent, FilterPanelComponent, ItemListComponent],
  templateUrl: './results-drawer.component.html',
  styleUrl: './results-drawer.component.less'
})
export class ResultsDrawerComponent implements AfterViewInit {

  state = inject(StateService);
  private el = inject(ElementRef);
  private platform = inject(PlatformService);
  private destroyRef = inject(DestroyRef);

  expanded = signal(false);

  ngAfterViewInit() {
    this.platform.browser(() => {
      // The map reads this as bottom padding, and it also trims the viewport rectangle
      // that "באיזור המפה" filters by — so the sheet must keep reporting its own height.
      new Observable<ResizeObserverEntry[]>((observer) => {
        const resize = new ResizeObserver((entries) => observer.next(entries));
        resize.observe(this.el.nativeElement);
        return () => resize.disconnect();
      }).pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((entries) => {
        const entry = entries[0];
        if (entry) {
          this.state.mapPaddingBottom.set(entry.contentRect.height);
        }
      });
    });
  }
}
