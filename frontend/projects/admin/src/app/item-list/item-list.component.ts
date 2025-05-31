import { Component } from '@angular/core';
import { ApiService } from '../api.service';
import { ActivatedRoute } from '@angular/router';
import { ItemListItemComponent } from "../item-list-item/item-list-item.component";

@Component({
  selector: 'app-item-list',
  imports: [ItemListItemComponent],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.less'
})
export class ItemListComponent {

    constructor(public api: ApiService, private route: ActivatedRoute) {
        this.api.updateFromRoute(route.snapshot);
    }
}
