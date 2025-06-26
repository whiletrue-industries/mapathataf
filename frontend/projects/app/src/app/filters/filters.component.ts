import { Component, effect, inject } from '@angular/core';
import { ResultItem, StateService } from '../state.service';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, filter, forkJoin, from, of, switchMap } from 'rxjs';
import { MapboxService } from '../mapbox.service';

@Component({
  selector: 'app-filters',
  imports: [
    FormsModule
  ],
  templateUrl: './filters.component.html',
  styleUrl: './filters.component.less'
})
export class FiltersComponent {

  state = inject(StateService);
  mapbox = inject(MapboxService)

  constructor() {
    toObservable(this.state.searchTerm).pipe(
      switchMap(term => {
        // console.log('Search term changed', term);
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
          // console.log('Autocomplete item', term, item.resolved.name, item.resolved.address);
          return item.resolved.name.includes(term) || item.resolved.address.includes(term);
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
      // console.log('Autocomplete results', results);
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
}