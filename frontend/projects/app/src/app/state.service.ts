import { computed, effect, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  section = signal('education');

  items = computed(() => {
    const items = this.api.items();
    const section = this.section();
    return items.filter(item => {
      // if (item.resolved.facility_kind === section) {
      //   console.log('Filtering item:', item, 'for section:', section);
      // }
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
    if (fragment) {
      const parts = fragment.split('/');
      if (parts.length > 0) {
        const section = parts[0];
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
