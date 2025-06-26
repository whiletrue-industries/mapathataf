import { Component, computed } from '@angular/core';
import { ApiService } from '../api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemListItemComponent } from "../item-list-item/item-list-item.component";
import { StateService } from '../state.service';
import { FormsModule } from '@angular/forms';

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

  filteredItems = computed(() => {
    let items = this.api.items() || [];
    // console.log('Filtering items...', items.length, 'items before filtering');
    // console.log('FK', this.state.facilityKind(), 'IS', this.state.itemSource(), 'AP', this.state.appPublication(), 'AU', this.state.adminUpdated(), 'UU', this.state.userUpdated(), 'LS', this.state.licensingStatus(), 'MT', this.state.mentoringType(), 'SQ', this.state.searchQuery());
    items = items.filter(item => !!item.admin?._private_deleted === (this.state.appPublication() === 'recycled'));
    if (this.state.facilityKind() !== 'all') {
      items = items.filter(item => item.resolved.facility_kind === this.state.facilityKind());
    }
    if (this.state.itemSource() !== 'all') {
      items = items.filter(item => (!!item.official && item.official.length > 0) === (this.state.itemSource() === 'official'));
    }
    if (this.state.appPublication() !== 'all' && this.state.appPublication() !== 'recycled') {
      items = items.filter(item => !!item.admin?.app_publication === (this.state.appPublication() === 'published'));
    }
    if (this.state.adminUpdated() !== 'all') {
      items = items.filter(item => !!item.admin?.updated_at === (this.state.adminUpdated() === 'updated'));
    }
    if (this.state.userUpdated() !== 'all') {
      items = items.filter(item => !!item.user?.updated_at === (this.state.userUpdated() === 'updated'));
    }
    if (this.state.licensingStatus() !== 'all') {
      if (this.state.facilityKind() === 'education') {
        items = items.filter(item => item.resolved.license_status_code === this.state.licensingStatus());
      }
    }
    if (this.state.mentoringType() !== 'all') {
      if (this.state.facilityKind() === 'education') {
        items = items.filter(item => item.resolved.mentoring_type === this.state.mentoringType());
      }
    }
    if (this.state.searchQuery()) {
      const query = this.state.searchQuery().toLowerCase();
      items = items.filter(item => {
        return item.resolved.name.toLowerCase().includes(query) || item.resolved.address.toLowerCase().includes(query);
      });
    }
    items = items.sort((a, b) => a.resolved?.name?.localeCompare(b.resolved?.name));
    // console.log('Filtering items...', items.length, 'items after filtering');
    return items;
  });

  constructor(public api: ApiService, private route: ActivatedRoute, public state: StateService, private router: Router) {
      this.api.updateFromRoute(route.snapshot);
  }

  addNew() {
    this.api.newItem()?.subscribe((item: any) => {
      this.router.navigate(['/', this.api.workspaceId(), item.id], { queryParamsHandling: 'merge' });
    });
  }
}
