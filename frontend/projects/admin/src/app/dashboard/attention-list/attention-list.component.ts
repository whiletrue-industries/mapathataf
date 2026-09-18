import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Figure } from '../dashboard-stats';

@Component({
  selector: 'app-attention-list',
  imports: [ DecimalPipe ],
  templateUrl: './attention-list.component.html',
  styleUrl: './attention-list.component.less'
})
export class AttentionListComponent {
  @Input() figures: Figure[] = [];

  @Output() pick = new EventEmitter<Figure>();
}
