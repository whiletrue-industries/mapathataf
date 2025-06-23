import { computed, effect, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from './api.service';

export type ResultItem = {
  name: string;
  id: string;
  kind: 'item' | 'street';
};

@Injectable({
  providedIn: 'root'
})
export class StateService {

  section = signal('education');

  items = computed(() => {
    const items = this.api.items();
    const section = this.section();
    console.log('StateService items for section:', section, items.length);
    return items.filter(item => {
      return (item.resolved.facility_kind === section);
    });
  });

  selectedId = signal<string | null>(null);
  selectedItem = computed(() => {
    const id = this.selectedId();
    const items = this.items();
    if (id) {
      return items.find((item) => item.info._id === id);
    }
    return null;
  });
  searchTerm = signal<string>('');
  searchResults = signal<ResultItem[] | null>(null);


  constructor(private router: Router, private route: ActivatedRoute, private api: ApiService) {
    effect(() => {
      const section = this.section();
      console.log('MainComponent section:', section);
      const parts = [section];
      const fragment = parts.join('/');
      if (section) {
        this.router.navigate([], {
          relativeTo: this.route, fragment
        });
      }
    });    
  }

  updateStateFromFragment(fragment: string | null) {
    console.log('Updating state from fragment:', fragment);
    if (fragment) {
      const parts = fragment.split('/');
      if (parts.length > 0) {
        const section = parts[0];
        console.log('Setting section to:', section);
        this.section.set(section);
      }
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
