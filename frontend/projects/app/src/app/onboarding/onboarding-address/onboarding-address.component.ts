import { Component, inject, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, from, of, switchMap } from 'rxjs';
import { MapboxService } from '../../mapbox.service';
import { ResultItem } from '../../state.service';
import { OnboardingAddress } from '../onboarding.service';

@Component({
  selector: 'app-onboarding-address',
  imports: [FormsModule],
  templateUrl: './onboarding-address.component.html',
  styleUrl: './onboarding-address.component.less'
})
export class OnboardingAddressComponent {

  selected = output<OnboardingAddress | null>();

  mapbox = inject(MapboxService);

  query = signal<string>('');
  results = signal<ResultItem[]>([]);
  address = signal<OnboardingAddress | null>(null);

  constructor() {
    toObservable(this.query).pipe(
      switchMap(term => {
        if (this.address() || !term || term.length < 3) {
          this.results.set([]);
          return from([]);
        }
        return of(term);
      }),
      debounceTime(500),
      switchMap(term => this.mapbox.autocomplete(term)),
    ).subscribe((results) => {
      if (this.query() && this.query().length && !this.address()) {
        this.results.set(results);
      } else {
        this.results.set([]);
      }
    });
  }

  select(result: ResultItem) {
    this.results.set([]);
    this.query.set(result.name);
    this.mapbox.retrieveCoordinates(result.id).subscribe((coordinates) => {
      this.address.set({name: result.name, center: coordinates});
    });
  }

  edit() {
    this.address.set(null);
  }

  confirm() {
    this.selected.emit(this.address());
  }

  skip() {
    this.selected.emit(null);
  }
}
