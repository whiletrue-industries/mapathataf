import { Component, computed, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import dayjs from 'dayjs';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { ItemEditSectionComponent } from '../item-edit-section/item-edit-section.component';
import { computeStats, Figure, Scope } from './dashboard-stats';
import { StatTileComponent } from './stat-tile/stat-tile.component';
import { BarBreakdownComponent } from './bar-breakdown/bar-breakdown.component';
import { AttentionListComponent } from './attention-list/attention-list.component';
import { NeighborhoodTableComponent } from './neighborhood-table/neighborhood-table.component';

@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    RouterLink,
    ItemEditSectionComponent,
    StatTileComponent,
    BarBreakdownComponent,
    AttentionListComponent,
    NeighborhoodTableComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.less'
})
export class DashboardComponent {

  scope = signal<Scope>('published');

  stats = computed(() => computeStats(this.api.items() || [], this.api.workspace(), this.scope()));

  bandMax = computed(() => Math.max(1, ...(this.stats().capacity?.bands || []).map(band => band.total)));

  constructor(public api: ApiService, route: ActivatedRoute, private state: StateService, private router: Router) {
    this.api.updateFromRoute(route.snapshot);
  }

  // The workspace answers first and carries the privilege, so its arrival is what tells a
  // page still loading apart from a visitor who may not see it.
  loaded = computed(() => this.api.workspace()?._p !== undefined);

  open(figure: Figure) {
    this.state.apply(figure.filter);
    this.router.navigate(['/', this.api.workspaceId(), 'items'], { queryParamsHandling: 'preserve' });
  }

  typesText = computed(() => (this.stats().capacity?.types || []).map(type => `${type.count} ${type.label}`).join(', '));

  percent(part: number, whole: number): number {
    return whole ? Math.round(100 * part / whole) : 0;
  }

  date(value: string | null): string {
    return value ? dayjs(value).format('D.M.YYYY') : '';
  }
}
