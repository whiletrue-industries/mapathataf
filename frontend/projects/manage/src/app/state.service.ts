import { Injectable, signal } from '@angular/core';

export type FlagFilter = 'all' | 'yes' | 'no';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  filterFavorite = signal<FlagFilter>('all');
  filterActive = signal<FlagFilter>('all');
  searchQuery = signal<string>('');
}
