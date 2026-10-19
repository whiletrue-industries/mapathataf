import { Component, DestroyRef, inject, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { OnboardingService } from '../onboarding/onboarding.service';
import { MenuPageComponent } from './menu-page/menu-page.component';

// Marks the history entry that the open menu sits on.
const HISTORY_FLAG = 'menu';

// The round menu button over the map, and the full-page menu it opens.
//
// The menu is an overlay rather than a route, so opening it doesn't tear down the map.
// Like the lightbox, opening pushes a same-URL history entry: back closes the menu. The
// menu's links leave that entry on the stack, so coming back from a content page lands
// on it again, and a menu constructed on a flagged entry starts open.
@Component({
  selector: 'app-menu',
  imports: [MenuPageComponent],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.less'
})
export class MenuComponent {
  onboarding = inject(OnboardingService);

  // null when rendering on the server
  private window = inject(DOCUMENT).defaultView;

  open = signal<boolean>(!!this.window?.history.state?.[HISTORY_FLAG]);

  constructor() {
    const onPopState = () => this.open.set(!!this.window?.history.state?.[HISTORY_FLAG]);
    this.window?.addEventListener('popstate', onPopState);
    inject(DestroyRef).onDestroy(() => this.window?.removeEventListener('popstate', onPopState));
  }

  openMenu() {
    this.onboarding.menuTipVisible.set(false);
    if (!this.open()) {
      const history = this.window?.history;
      // Spread, so the router's own bookkeeping on this entry carries over.
      history?.pushState({...history.state, [HISTORY_FLAG]: true}, '');
      this.open.set(true);
    }
  }

  closeMenu() {
    this.open.set(false);
    // Closed from the inside: take our entry back off the stack. If the flag is gone the
    // router has navigated since and the top entry is no longer ours.
    const history = this.window?.history;
    if (history?.state?.[HISTORY_FLAG]) {
      history.back();
    }
  }
}
