import { Component, DestroyRef, effect, ElementRef, inject, signal } from '@angular/core';
import { timer } from 'rxjs';
import { PlatformService } from '../../platform.service';
import { StateService } from '../../state.service';

@Component({
  selector: 'app-item-list',
  imports: [],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.less'
})
export class ItemListComponent {

  state = inject(StateService);
  private el = inject(ElementRef);
  private platform = inject(PlatformService);

  private initialized = signal(false);

  constructor() {
    this.platform.browser(() => this.initialized.set(true));
    effect(() => {
      const selectedId = this.state.selectedId();
      const items = this.state.items();
      if (!this.initialized() || !selectedId || !items?.length) {
        return;
      }
      timer(0).subscribe(() => {
        const container = this.el?.nativeElement as HTMLElement | undefined;
        const row = container?.querySelector(`[data-id="${selectedId}"]`) as HTMLElement | null;
        if (!container || !row) {
          return;
        }
        // Deliberately not scrollIntoView: that scrolls every scrollable ancestor, which
        // dragged the whole map layer out of position. Scroll only this list.
        const top = row.getBoundingClientRect().top
          - container.getBoundingClientRect().top
          + container.scrollTop;
        container.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }
}
