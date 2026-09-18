import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-stat-tile',
  imports: [ DecimalPipe ],
  templateUrl: './stat-tile.component.html',
  styleUrl: './stat-tile.component.less'
})
export class StatTileComponent {
  @Input() value: number;
  @Input() label: string;
  @Input() hint: string | null = null;
}
