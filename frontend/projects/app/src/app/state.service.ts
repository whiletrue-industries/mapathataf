import { computed, effect, Inject, Injectable, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from './api.service';
import { DOCUMENT } from '@angular/common';

export type ResultItem = {
  name: string;
  id: string;
  kind: 'item' | 'street';
};

export type FilterKind = 'age_group' | 'health_subkind' | 'community_subkind' | 'licensing' | 'subsidy' | 'mentoring';
@Injectable({
  providedIn: 'root'
})
export class StateService {
  
  workspaceId = signal<string>('');
  section = signal('education');
  
  items = computed(() => {
    let items = this.api.items();
    const section = this.section();
    items = items.filter(item => item.resolved.facility_kind === section);
    console.log('StateService items for section:', section, items.length);
    if (this.filterAgeGroup()) {
      items = items.filter(item => {
        return this.filterAgeGroup()!.includes(item.resolved.age_group);
      });
    }
    if (this.filterLicensing() && this.section() === 'education') {
      items = items.filter(item => {
        return this.filterLicensing()!.includes(item.resolved.license_status_code);
      });
    }
    if (this.filterHealthSubkind() && this.section() === 'health') {
      items = items.filter(item => {
        return this.filterHealthSubkind()!.includes(item.resolved.facility_sub_kind);
      });
    }
    if (this.filterCommunitySubkind() && this.section() === 'community') {
      items = items.filter(item => {
        return this.filterCommunitySubkind()!.includes(item.resolved.facility_sub_kind);
      });
    }
    if (this.filterSubsidy() && this.section() === 'education') {
      items = items.filter(item => {
        return this.filterSubsidy()!.includes(item.resolved.subsidized ? 'yes' : 'no');
      });
    }
    if (this.filterMentoring() && this.section() === 'education') {
      items = items.filter(item => {
        return this.filterMentoring()!.includes(item.resolved.mentoring_type);
      });
    }
    return items;
  });
  
  selectedId = signal<string | null>(null);
  selectedItem = computed(() => {
    const id = this.selectedId();
    const items = this.items();
    if (id && items && items.length > 0) {
      const ret = items.find((item) => item.id === id);
      // console.log('ITEM', id, ret);
      return ret || null;
    }
    return null;
  });
  searchTerm = signal<string>('');
  searchResults = signal<ResultItem[] | null>(null);
  mapState = signal<number[]>([]);
  askZoom = signal<[number, number, number] | null>(null);
  mapPaddingBottom = signal<number>(0);
  
  // Filters
  filtersExpanded = signal<boolean>(false);
  filterOptions = signal<FilterKind | null>(null);
  filterAgeGroup = signal<string[] | null>(null);
  filterHealthSubkind = signal<string[] | null>(null);
  filterCommunitySubkind = signal<string[] | null>(null);
  filterLicensing = signal<string[] | null>(null);
  filterSubsidy = signal<string[] | null>(null);
  filterMentoring = signal<string[] | null>(null);
  
  filterCount = computed(() => {
    let count = 0;
    if (this.filterAgeGroup()) count++;
    if (this.section() === 'health') {
      if (this.filterHealthSubkind()) count++;
    }
    if (this.section() === 'community') {
      if (this.filterCommunitySubkind()) count++;
    }
    if (this.section() === 'education') {
      if (this.filterLicensing()) count++;
      if (this.filterSubsidy()) count++;
      if (this.filterMentoring()) count++;
    }
    return count;
  });
  
  constructor(private router: Router, private route: ActivatedRoute, private api: ApiService, @Inject(DOCUMENT) private document: Document,
  ) {
    effect(() => {
      const section = this.section();
      console.log('MainComponent section:', section);
      const parts = [section];
      
      const mapState = this.mapState();
      if (mapState.length === 3) {
        parts.push(mapState[0].toFixed(6), mapState[1].toFixed(6), mapState[2].toFixed(2));
      } else {
        parts.push('0', '0', '0');
      }
      
      for (const filter of [
        this.filterAgeGroup(),
        this.filterHealthSubkind(),
        this.filterCommunitySubkind(),
        this.filterLicensing(),
        this.filterSubsidy(),
        this.filterMentoring()
      ]) {
        if (filter && filter.length > 0) {
          parts.push(filter.join(';'));
        } else {
          parts.push('');
        }
      }
      
      const selectedId = this.selectedId();
      if (selectedId) {
        parts.push(selectedId);
      }
      
      const fragment = parts.join('/');
      if (section) {
        this.router.navigate([], {
          relativeTo: this.route, fragment
        });
      }
    });
    effect(() => {
      const workspace = this.api.workspace();
      const item = this.selectedItem();
      for (const key of ['og:url', 'twitter:url']) {
        const metaDescription = this.document.querySelector(`meta[property="${key}"]`);
        if (metaDescription) {
          metaDescription.setAttribute('content', `https://app.tafmap.org.il/${this.workspaceId()}`);
        } else {
          console.log(`Meta tag not found: ${key}`);
        }
      }
      let title = 'מפת הטף';
      if (workspace && workspace.city) {
        title += ` - ${workspace.city}`;
      }
      if (item && item.resolved.name) {
        title += `: ${item.resolved.name}`;
      }
      for (const key of ['og:title', 'twitter:title']) {
        const metaTitle = this.document.querySelector(`meta[property="${key}"]`);
        if (metaTitle) {
          metaTitle.setAttribute('content', title);
        }
      }
      this.document.querySelector('meta[name="title"]')?.setAttribute('content', title);
      this.document.title = title;
    });
  }

  updateStateFromFragment(fragment: string | null) {
    console.log('Updating state from fragment:', fragment);
    if (fragment) {
      let parts = fragment.split('/');
      if (parts.length > 0) {
        const section = parts[0];
        console.log('Setting section to:', section);
        this.section.set(section);
        parts = parts.slice(1);
        
        if (parts.length >= 3) {
          try {
            const lng = parseFloat(parts[0]);
            const lat = parseFloat(parts[1]);
            const zoom = parseFloat(parts[2]);
            if (lat && lng && zoom) {
              this.askZoom.set([lng, lat, zoom]);
            }
          } catch (e) {
            // nvm
          }
          parts = parts.slice(3);
          
          if (parts.length >= 6) {
            this.filterAgeGroup.set(parts[0] ? parts[0].split(';') : null);
            this.filterHealthSubkind.set(parts[1] ? parts[1].split(';') : null);
            this.filterCommunitySubkind.set(parts[2] ? parts[2].split(';') : null);
            this.filterLicensing.set(parts[3] ? parts[3].split(';') : null);
            this.filterSubsidy.set(parts[4] ? parts[4].split(';') : null);
            this.filterMentoring.set(parts[5] ? parts[5].split(';') : null);
            parts = parts.slice(6);
            if (parts.length > 0) {
              const selectedId = parts[0];
              console.log('Setting selectedId to:', selectedId);
              this.selectedId.set(selectedId);
            } else {
              this.selectedId.set(null);
            }
          }
        }
      }
    } else {
      console.log('No fragment, resetting filter licensing to defaults');
      this.filterLicensing.set(['valid', 'in_progress', 'not_needed']);
    }
  }

  selectId(selectedId: any) {
    this.selectedId.update((value) => {
      if (value === selectedId) {
        return null;
      }
      return selectedId;
    });
  }
}
