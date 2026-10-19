import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MarkdownComponent } from './markdown/markdown.component';
import { StateService } from '../state.service';
import { ApiService } from '../api.service';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { cityPage, cityPageTitle, FROM_MENU } from '../menu/menu-items';

@Component({
  selector: 'app-about',
  imports: [MarkdownComponent, PageHeaderComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.less'
})
export class AboutComponent {
  private router = inject(Router);
  state = inject(StateService);
  api = inject(ApiService);

  section = signal<string>('');
  href = signal<string>('');
  // The city page names its workspace, so it also works on a reload or a shared link
  workspaceId = signal<string>('');

  cityPage = computed(() => cityPage(this.api.workspace()));
  cityPageTitle = computed(() => cityPageTitle(this.api.workspace()));

  constructor(route: ActivatedRoute) {
    route.params.subscribe(params => {
      this.section.set(params['section']);
    });
    route.queryParams.subscribe(queryParams => {
      this.href.set(queryParams['href'] || '');
      const workspaceId = queryParams['workspace'] || this.state.workspaceId();
      this.workspaceId.set(workspaceId);
      if (workspaceId && workspaceId !== this.state.workspaceId()) {
        this.api.fetchWorkspace(workspaceId).subscribe();
      }
    });
  }

  close() {
    // Opened from the menu: back onto it. Opened directly (a shared link, a reload after
    // the state effect pushed its fragment): on to the city's map, if we know the city.
    if (window.history.state?.[FROM_MENU] || !this.workspaceId()) {
      window.history.back();
    } else {
      this.router.navigate(['/', this.workspaceId()]);
    }
  }
}
