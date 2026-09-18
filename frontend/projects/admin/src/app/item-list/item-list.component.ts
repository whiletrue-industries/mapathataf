import { Component, computed } from '@angular/core';
import { ApiService } from '../api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemListItemComponent } from "../item-list-item/item-list-item.component";
import { StateService } from '../state.service';
import { FormsModule } from '@angular/forms';
import { ExportService } from '../export.service';
import { filterItems, MISSING_OPTIONS } from '../item-filter';

@Component({
  selector: 'app-item-list',
  imports: [
    ItemListItemComponent,
    FormsModule
  ],
  templateUrl: './item-list.component.html',
  styleUrl: './item-list.component.less'
})
export class ItemListComponent {

  MISSING_OPTIONS = MISSING_OPTIONS;

  filteredItems = computed(() => {
    const items = filterItems(this.api.items() || [], this.state.filters());
    return items.sort((a, b) => a.resolved?.name?.localeCompare(b.resolved?.name));
  });

  constructor(public api: ApiService, private route: ActivatedRoute, public state: StateService, private router: Router,
              private exportService: ExportService) {
      this.api.updateFromRoute(route.snapshot);
  }

  downloadExcel() {
    this.exportService.exportItems(this.filteredItems());
  }

  addNew() {
    this.api.newItem()?.subscribe((item: any) => {
      this.router.navigate(['/', this.api.workspaceId(), item.id], { queryParamsHandling: 'merge' });
    });
  }
}
