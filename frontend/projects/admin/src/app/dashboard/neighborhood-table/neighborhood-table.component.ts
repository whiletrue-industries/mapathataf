import { Component, computed, input, output, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Figure, NeighborhoodRow } from '../dashboard-stats';

const ROWS_SHOWN = 8;

@Component({
  selector: 'app-neighborhood-table',
  imports: [ DecimalPipe ],
  templateUrl: './neighborhood-table.component.html',
  styleUrl: './neighborhood-table.component.less'
})
export class NeighborhoodTableComponent {
  rows = input<NeighborhoodRow[]>([]);
  unassigned = input<Figure | null>(null);

  pick = output<Figure>();

  all = signal(false);
  shown = computed(() => this.all() ? this.rows() : this.rows().slice(0, ROWS_SHOWN));
  hidden = computed(() => Math.max(0, this.rows().length - ROWS_SHOWN));
  // Bars share one scale, so the busiest neighbourhood fills its track.
  max = computed(() => Math.max(1, ...this.rows().map(row => row.count)));
}
