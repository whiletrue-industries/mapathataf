import { Component, inject } from '@angular/core';
import { ResultItem, StateService } from '../state.service';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, forkJoin, from, of, switchMap } from 'rxjs';
import { MapboxService } from '../mapbox.service';

@Component({
  selector: 'app-search-bar',
  imports: [
    FormsModule
  ],
  templateUrl: './search-bar.component.html',
  styleUrl: './search-bar.component.less'
})
export class SearchBarComponent {

  state = inject(StateService);
  mapbox = inject(MapboxService)

  constructor() {
    toObservable(this.state.searchTerm).pipe(
      switchMap(term => {
        if (!term || term.length < 3) {
          this.state.searchResults.set(null);
          return from([]);
        }
        return of(term);
      }),
      debounceTime(500),
      switchMap(term => {
        const items = this.state.items();
        const relevant: ResultItem[] = items.filter(item => {
          return (item.resolved.name || '').includes(term) ||
            [item.resolved.address, item.resolved.formatted_address, item.resolved.original_address]
              .some((address: string) => address && address.includes(term));
        }).map(item => {
          return {
            name: item.resolved.name,
            id: item.id,
            kind: 'item',
          };
        });
        this.state.searchResults.set([...relevant]);
        return forkJoin([
          from([relevant]),
          this.mapbox.autocomplete(term),
        ]);
      })
    ).subscribe((results: [ResultItem[], ResultItem[]]) => {
      if (this.state.searchTerm() && this.state.searchTerm().length) {
        this.state.searchResults.set([...results[0], ...results[1]]);
      } else {
        this.state.searchResults.set(null);
      }
    });
  }

  itemSelect(result: ResultItem) {
    this.state.searchResults.set(null);
    this.state.selectedId.set(result.id);
  }

  autocompleteSelect(result: ResultItem) {
    this.state.searchResults.set(null);
    this.state.searchTerm.set('');
    this.mapbox.autocompleteRetrieve(result.id);
  }

  // While an item is selected the field shows its name, so clearing means deselecting.
  clear() {
    if (this.state.selectedId()) {
      this.state.selectedId.set(null);
    } else {
      this.state.searchTerm.set('');
    }
  }
}
