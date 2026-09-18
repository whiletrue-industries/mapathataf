import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Breakdown, Figure } from '../dashboard-stats';

@Component({
  selector: 'app-bar-breakdown',
  imports: [ DecimalPipe ],
  templateUrl: './bar-breakdown.component.html',
  styleUrl: './bar-breakdown.component.less'
})
export class BarBreakdownComponent {
  @Input() breakdown: Breakdown;
  // 'stacked' for parts of a whole, 'rows' for groups that overlap and so cannot be stacked.
  @Input() mode: 'stacked' | 'rows' = 'stacked';

  @Input() unit = 'מסגרות';

  @Output() pick = new EventEmitter<Figure>();

  percent(figure: Figure): number {
    return this.breakdown.total ? Math.round(100 * figure.count / this.breakdown.total) : 0;
  }

  tooltip(figure: Figure): string {
    return `${figure.label}: ${figure.count} (${this.percent(figure)}%)`;
  }
}
