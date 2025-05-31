import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-item-list-item',
  imports: [
    RouterLink
  ],
  templateUrl: './item-list-item.component.html',
  styleUrl: './item-list-item.component.less'
})
export class ItemListItemComponent {
  @Input() item: any;
}
