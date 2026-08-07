import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { StateService } from './state.service';
import { ApiService } from './api.service';

describe('StateService age group filtering', () => {
  let state: StateService;
  let api: ApiService;

  function educationItem(id: string, age_group?: string[]): any {
    return { id, resolved: { facility_kind: 'education', age_group } };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });
    state = TestBed.inject(StateService);
    api = TestBed.inject(ApiService);
    api.items.set([
      educationItem('babies', ['birth_to_1']),
      educationItem('toddlers', ['1_to_2', '2_to_3']),
      educationItem('everything', ['birth_to_1', '1_to_2', '2_to_3', '3_to_6']),
      educationItem('unknown', undefined),
    ]);
  });

  it('shows all items when no age filter is set', () => {
    expect(state.items().map((i) => i.id)).toEqual(['babies', 'toddlers', 'everything', 'unknown']);
  });

  it('matches items containing any of the selected ages', () => {
    state.filterAgeGroup.set(['1_to_2']);
    expect(state.items().map((i) => i.id)).toEqual(['toddlers', 'everything']);
  });

  it('matches across multiple selected ages', () => {
    state.filterAgeGroup.set(['birth_to_1', '3_to_6']);
    expect(state.items().map((i) => i.id)).toEqual(['babies', 'everything']);
  });

  it('excludes items without an age group when a filter is active', () => {
    state.filterAgeGroup.set(['birth_to_1', '1_to_2', '2_to_3', '3_to_6']);
    expect(state.items().map((i) => i.id)).toEqual(['babies', 'toddlers', 'everything']);
  });
});
