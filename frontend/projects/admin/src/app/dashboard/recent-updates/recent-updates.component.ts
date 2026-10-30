import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import dayjs from 'dayjs';
import { RecentUpdate } from '../dashboard-stats';

const ROWS_SHOWN = 5;

@Component({
  selector: 'app-recent-updates',
  imports: [ RouterLink ],
  templateUrl: './recent-updates.component.html',
  styleUrl: './recent-updates.component.less'
})
export class RecentUpdatesComponent {
  updates = input<RecentUpdate[]>([]);
  workspaceId = input<string | null>(null);

  all = signal(false);
  shown = computed(() => this.all() ? this.updates() : this.updates().slice(0, ROWS_SHOWN));
  hidden = computed(() => Math.max(0, this.updates().length - ROWS_SHOWN));

  date(value: string): string {
    return dayjs(value).format('D.M.YYYY');
  }
}
