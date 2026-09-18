import { computed, Injectable, signal } from '@angular/core';
import { DEFAULT_FILTERS, ExtraFilter, ItemFilters } from './item-filter';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  // Signals to hold the filtering state
  facilityKind = signal('all');
  itemSource = signal('all');
  appPublication = signal('all');
  adminUpdated = signal('all');
  userUpdated = signal('all');
  licensingStatus = signal('all');
  mentoringType = signal('all');
  missing = signal('all');
  searchQuery = signal('');
  extra = signal<ExtraFilter | null>(null);

  filters = computed<ItemFilters>(() => ({
    facilityKind: this.facilityKind(),
    itemSource: this.itemSource(),
    appPublication: this.appPublication(),
    adminUpdated: this.adminUpdated(),
    userUpdated: this.userUpdated(),
    licensingStatus: this.licensingStatus(),
    mentoringType: this.mentoringType(),
    missing: this.missing(),
    searchQuery: this.searchQuery(),
    extra: this.extra(),
  }));

  // Replaces the whole filter state: a dashboard drill-down must not inherit whatever the
  // list was last filtered by, or its count would stop matching the figure that was clicked.
  apply(filters: Partial<ItemFilters>) {
    const f = { ...DEFAULT_FILTERS, ...filters };
    this.facilityKind.set(f.facilityKind);
    this.itemSource.set(f.itemSource);
    this.appPublication.set(f.appPublication);
    this.adminUpdated.set(f.adminUpdated);
    this.userUpdated.set(f.userUpdated);
    this.licensingStatus.set(f.licensingStatus);
    this.mentoringType.set(f.mentoringType);
    this.missing.set(f.missing);
    this.searchQuery.set(f.searchQuery);
    this.extra.set(f.extra);
  }
}
