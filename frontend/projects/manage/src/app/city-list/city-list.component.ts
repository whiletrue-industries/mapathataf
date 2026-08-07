import { Component, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';
import { filterWorkspaces } from '../filtering';
import { CityListItemComponent } from '../city-list-item/city-list-item.component';

@Component({
  selector: 'app-city-list',
  imports: [FormsModule, CityListItemComponent],
  templateUrl: './city-list.component.html',
  styleUrl: './city-list.component.less'
})
export class CityListComponent {
  api = inject(ApiService);
  state = inject(StateService);

  filtered = computed(() => filterWorkspaces(
    this.api.workspaces(), this.state.filterFavorite(), this.state.filterActive(), this.state.searchQuery()));

  constructor() {
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.api.fetchWorkspaces();
    }
  }
}
