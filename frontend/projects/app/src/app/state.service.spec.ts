import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Bounds, StateService } from './state.service';
import { ApiService } from './api.service';
import { DEFAULT_LICENSING, FilterKind } from './filter-defs';

function makeItem(id: string, facility_kind: string, resolved: any = {}): any {
  return { id, resolved: { facility_kind, lng: 34.8, lat: 31.0, ...resolved } };
}

function setup(): { state: StateService, api: ApiService } {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideRouter([])],
  });
  return { state: TestBed.inject(StateService), api: TestBed.inject(ApiService) };
}

describe('StateService age group filtering', () => {
  let state: StateService;
  let api: ApiService;

  function educationItem(id: string, age_group?: string[]): any {
    return makeItem(id, 'education', { age_group });
  }

  beforeEach(() => {
    ({ state, api } = setup());
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

describe('StateService sections and counts', () => {
  let state: StateService;
  let api: ApiService;

  beforeEach(() => {
    ({ state, api } = setup());
    api.items.set([
      makeItem('e1', 'education', { license_status_code: 'valid' }),
      makeItem('h1', 'health', { facility_sub_kind: 'טיפת חלב' }),
      makeItem('e2', 'education', { license_status_code: 'valid' }),
      makeItem('c1', 'community', { facility_sub_kind: 'חוגים' }),
      makeItem('x1', 'not-set'),
    ]);
  });

  it('defaults to the all section', () => {
    expect(state.section()).toEqual('all');
  });

  it('keeps api order in the all section rather than grouping by category', () => {
    expect(state.items().map((i) => i.id)).toEqual(['e1', 'h1', 'e2', 'c1']);
  });

  it('drops items whose facility kind is not a real section', () => {
    for (const section of ['all', 'education', 'health', 'community'] as const) {
      state.section.set(section);
      expect(state.items().map((i) => i.id)).not.toContain('x1');
    }
  });

  it('reports the same counts no matter which section is selected', () => {
    const fromAll = state.sectionCounts();
    state.section.set('health');
    expect(state.sectionCounts()).toEqual(fromAll);
  });

  it('makes each chip count predict the length of its list', () => {
    for (const section of ['all', 'education', 'health', 'community'] as const) {
      state.section.set(section);
      expect(state.items().length).toEqual(state.sectionCounts()[section].visible);
    }
  });

  it('adds the three category counts up to the all count while nothing is filtered', () => {
    const counts = state.sectionCounts();
    expect(counts['all'].visible).toEqual(
      counts['education'].visible + counts['health'].visible + counts['community'].visible);
  });

  it('narrows one category without touching the others', () => {
    state.filterHealthSubkind.set(['הדרכה וייעוץ']);
    const counts = state.sectionCounts();
    expect(counts['health'].visible).toEqual(0);
    expect(counts['education'].visible).toEqual(2);
    expect(counts['community'].visible).toEqual(1);
  });
});

describe('StateService licensing default', () => {
  let state: StateService;
  let api: ApiService;

  beforeEach(() => {
    ({ state, api } = setup());
    api.items.set([
      makeItem('licensed', 'education', { license_status_code: 'valid' }),
      makeItem('unlicensed', 'education', { license_status_code: 'did_not_apply' }),
      makeItem('health', 'health'),
    ]);
  });

  it('hides unlicensed frameworks from מסגרות חינוך by default', () => {
    state.section.set('education');
    expect(state.items().map((i) => i.id)).toEqual(['licensed']);
  });

  it('still counts unlicensed frameworks in the headline total', () => {
    expect(state.items().map((i) => i.id)).toEqual(['licensed', 'unlicensed', 'health']);
  });

  it('reports the default as the applied licensing values', () => {
    state.section.set('education');
    expect(state.appliedValues('licensing')).toEqual(DEFAULT_LICENSING);
  });

  it('applies an explicit licensing filter to both the category and the total', () => {
    state.filterLicensing.set(['did_not_apply']);
    expect(state.items().map((i) => i.id)).toEqual(['unlicensed', 'health']);
    state.section.set('education');
    expect(state.items().map((i) => i.id)).toEqual(['unlicensed']);
  });

  it('records a cleared licensing filter explicitly so the default cannot return', () => {
    state.section.set('education');
    state.clearFilter('licensing');
    expect(state.filterLicensing()).not.toBeNull();
    expect(state.items().map((i) => i.id)).toEqual(['licensed', 'unlicensed']);
  });
});

describe('StateService map scope', () => {
  let state: StateService;
  let api: ApiService;
  const inside: Bounds = [34.0, 31.0, 35.0, 32.0];

  beforeEach(() => {
    ({ state, api } = setup());
    api.items.set([
      makeItem('near', 'health', { lng: 34.5, lat: 31.5 }),
      makeItem('edge', 'health', { lng: 34.0, lat: 31.0 }),
      makeItem('far', 'health', { lng: 30.0, lat: 30.0 }),
    ]);
  });

  it('ignores the viewport while scoped to the whole authority', () => {
    state.mapBounds.set(inside);
    expect(state.items().length).toEqual(3);
    expect(state.scoped()).toBeFalse();
  });

  it('limits results to the viewport and keeps the city-wide total', () => {
    state.mapScope.set('map');
    state.mapBounds.set(inside);
    expect(state.items().map((i) => i.id)).toEqual(['near', 'edge']);
    expect(state.resultCount()).toEqual({ visible: 2, total: 3 });
    expect(state.scoped()).toBeTrue();
  });

  it('includes items sitting exactly on the boundary', () => {
    state.mapScope.set('map');
    state.mapBounds.set(inside);
    expect(state.items().map((i) => i.id)).toContain('edge');
  });

  it('behaves city-wide until the map reports bounds', () => {
    state.mapScope.set('map');
    expect(state.items().length).toEqual(3);
    expect(state.scoped()).toBeFalse();
  });

  it('follows the viewport as the user pans', () => {
    state.mapScope.set('map');
    state.mapBounds.set(inside);
    expect(state.items().length).toEqual(2);
    state.mapBounds.set([29.5, 29.5, 30.5, 30.5]);
    expect(state.items().map((i) => i.id)).toEqual(['far']);
  });
});

describe('StateService selection', () => {
  let state: StateService;
  let api: ApiService;

  beforeEach(() => {
    ({ state, api } = setup());
    api.items.set([
      makeItem('hidden', 'education', { license_status_code: 'did_not_apply' }),
      makeItem('shown', 'education', { license_status_code: 'valid' }),
    ]);
  });

  it('resolves an item that the active filters exclude from the list', () => {
    state.section.set('education');
    state.selectedId.set('hidden');
    expect(state.items().map((i) => i.id)).not.toContain('hidden');
    expect(state.selectedItem()?.id).toEqual('hidden');
  });

  it('keeps the selection when a pan drops the item out of the viewport', () => {
    state.selectedId.set('shown');
    state.mapScope.set('map');
    state.mapBounds.set([0, 0, 1, 1]);
    expect(state.items().length).toEqual(0);
    expect(state.selectedItem()?.id).toEqual('shown');
  });
});

describe('StateService filter count', () => {
  let state: StateService;

  beforeEach(() => {
    ({ state } = setup());
  });

  it('counts every active sub-filter across sections in the all view', () => {
    state.filterAgeGroup.set(['1_to_2']);
    state.filterHealthSubkind.set(['חוגים']);
    state.filterSubsidy.set(['yes']);
    expect(state.filterCount()).toEqual(3);
  });

  it('counts only the selected section’s own filters', () => {
    state.section.set('health');
    state.filterAgeGroup.set(['1_to_2']);
    state.filterHealthSubkind.set(['טיפת חלב']);
    state.filterSubsidy.set(['yes']);
    expect(state.filterCount()).toEqual(2);
  });
});

describe('StateService fragment', () => {
  let state: StateService;

  const OLD_LINK = 'education/34.790000/31.060000/14.50/birth_to_1/////';
  const OLD_LINK_WITH_ID = `${OLD_LINK}/item-42`;

  beforeEach(() => {
    ({ state } = setup());
  });

  describe('parsing old links', () => {
    it('keeps the section and defaults the scope to the whole authority', () => {
      state.updateStateFromFragment(OLD_LINK);
      expect(state.section()).toEqual('education');
      expect(state.mapScope()).toEqual('city');
      expect(state.askZoom()).toEqual([34.79, 31.06, 14.5]);
      expect(state.filterAgeGroup()).toEqual(['birth_to_1']);
      expect(state.selectedId()).toBeNull();
    });

    it('still reads a trailing id as an id, not as a scope', () => {
      state.updateStateFromFragment(OLD_LINK_WITH_ID);
      expect(state.selectedId()).toEqual('item-42');
      expect(state.mapScope()).toEqual('city');
      expect(state.section()).toEqual('education');
    });

    it('reads every filter segment', () => {
      state.updateStateFromFragment(
        'education/34.79/31.06/14/birth_to_1;1_to_2/a/b/valid/yes/municipal');
      expect(state.filterAgeGroup()).toEqual(['birth_to_1', '1_to_2']);
      expect(state.filterHealthSubkind()).toEqual(['a']);
      expect(state.filterCommunitySubkind()).toEqual(['b']);
      expect(state.filterLicensing()).toEqual(['valid']);
      expect(state.filterSubsidy()).toEqual(['yes']);
      expect(state.filterMentoring()).toEqual(['municipal']);
    });

    it('leaves every filter unset for empty segments', () => {
      state.updateStateFromFragment('education/34.79/31.06/14//////');
      expect(state.filterAgeGroup()).toBeNull();
      expect(state.filterLicensing()).toBeNull();
      expect(state.filterMentoring()).toBeNull();
    });
  });

  describe('parsing new links', () => {
    it('reads the scope off the section segment', () => {
      state.updateStateFromFragment('all,map/34.79/31.06/14//////');
      expect(state.section()).toEqual('all');
      expect(state.mapScope()).toEqual('map');
    });

    it('keeps the id last even with a scope present', () => {
      state.updateStateFromFragment('all,map/34.79/31.06/14///////item-7');
      expect(state.section()).toEqual('all');
      expect(state.mapScope()).toEqual('map');
      expect(state.selectedId()).toEqual('item-7');
    });

    it('accepts a scope on a concrete section', () => {
      state.updateStateFromFragment('education,map/34.79/31.06/14//////');
      expect(state.section()).toEqual('education');
      expect(state.mapScope()).toEqual('map');
    });
  });

  describe('parsing junk', () => {
    it('falls back to the all section rather than emptying the list', () => {
      state.updateStateFromFragment('bogus/34.79/31.06/14//////');
      expect(state.section()).toEqual('all');
    });

    it('falls back to the city scope', () => {
      state.updateStateFromFragment('education,bogus/34.79/31.06/14//////');
      expect(state.mapScope()).toEqual('city');
    });

    it('leaves state alone for a null fragment', () => {
      state.updateStateFromFragment(null);
      expect(state.section()).toEqual('all');
      expect(state.mapScope()).toEqual('city');
      expect(state.filterLicensing()).toBeNull();
      expect(state.selectedId()).toBeNull();
    });

    it('survives truncated fragments', () => {
      expect(() => state.updateStateFromFragment('education')).not.toThrow();
      expect(() => state.updateStateFromFragment('education/34/31/14')).not.toThrow();
      expect(state.filterAgeGroup()).toBeNull();
    });

    it('treats an empty trailing segment as no selection', () => {
      state.updateStateFromFragment('all/34.79/31.06/14///////');
      expect(state.selectedId()).toBeNull();
    });

    it('does not take a zeroed map position as a request to zoom', () => {
      state.updateStateFromFragment('all/0/0/0//////');
      expect(state.askZoom()).toBeNull();
    });
  });

  describe('serializing', () => {
    it('emits no scope suffix in the default scope', () => {
      expect(state.fragment().startsWith('all/')).toBeTrue();
      expect(state.fragment()).not.toContain(',');
    });

    it('appends the scope to the section segment', () => {
      state.mapScope.set('map');
      expect(state.fragment().split('/')[0]).toEqual('all,map');
    });

    it('formats the map position to a fixed precision', () => {
      state.mapState.set([34.7912345678, 31.0612345678, 14.5]);
      expect(state.fragment().split('/').slice(1, 4)).toEqual(['34.791235', '31.061235', '14.50']);
    });

    it('keeps the id as the final segment', () => {
      state.mapScope.set('map');
      state.selectedId.set('item-9');
      const parts = state.fragment().split('/');
      expect(parts[parts.length - 1]).toEqual('item-9');
      expect(parts.length).toEqual(11);
    });
  });

  describe('round trip', () => {
    const fixtures: Array<[string, (s: StateService) => void]> = [
      ['defaults', () => {}],
      ['every filter set', (s) => {
        s.section.set('education');
        s.filterAgeGroup.set(['birth_to_1', '1_to_2']);
        s.filterHealthSubkind.set(['טיפת חלב']);
        s.filterCommunitySubkind.set(['חוגים']);
        s.filterLicensing.set(['valid']);
        s.filterSubsidy.set(['yes']);
        s.filterMentoring.set(['municipal']);
      }],
      ['map scope', (s) => { s.mapScope.set('map'); }],
      ['selected item', (s) => { s.selectedId.set('item-3'); }],
      ['concrete section with scope and id', (s) => {
        s.section.set('community');
        s.mapScope.set('map');
        s.selectedId.set('item-4');
      }],
    ];

    for (const [name, apply] of fixtures) {
      it(`reproduces every signal: ${name}`, () => {
        apply(state);
        state.mapState.set([34.79, 31.06, 14.5]);
        const snapshot = {
          section: state.section(),
          mapScope: state.mapScope(),
          selectedId: state.selectedId(),
          age: state.filterAgeGroup(),
          health: state.filterHealthSubkind(),
          community: state.filterCommunitySubkind(),
          licensing: state.filterLicensing(),
          subsidy: state.filterSubsidy(),
          mentoring: state.filterMentoring(),
        };
        const fragment = state.fragment();

        // Wipe every signal the codec owns, so a parser that silently skips a field fails here.
        state.section.set('all');
        state.mapScope.set('city');
        state.selectedId.set(null);
        state.askZoom.set(null);
        for (const kind of Object.keys(state.filterSignals) as FilterKind[]) {
          state.filterSignals[kind].set(null);
        }

        state.updateStateFromFragment(fragment);
        expect({
          section: state.section(),
          mapScope: state.mapScope(),
          selectedId: state.selectedId(),
          age: state.filterAgeGroup(),
          health: state.filterHealthSubkind(),
          community: state.filterCommunitySubkind(),
          licensing: state.filterLicensing(),
          subsidy: state.filterSubsidy(),
          mentoring: state.filterMentoring(),
        }).toEqual(snapshot);
        expect(state.askZoom()).toEqual([34.79, 31.06, 14.5]);
      });
    }
  });
});
