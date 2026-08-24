import { computed, effect, Inject, Injectable, signal, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from './api.service';
import { DOCUMENT } from '@angular/common';
import { CONCRETE_SECTIONS, ConcreteSection, isConcreteSection, Section, SECTIONS, sectionDef } from './sections';
import { DEFAULT_LICENSING, FilterKind } from './filter-defs';

export type ResultItem = {
  name: string;
  id: string;
  kind: 'item' | 'street';
  /** A facility that exists in this city but is hidden by the filters or the map scope. */
  outsideFilter?: boolean;
};

export type MapScope = 'city' | 'map';

/** [west, south, east, north] */
export type Bounds = [number, number, number, number];

export type SectionCount = {
  /** Matching the current scope — what the list actually shows. */
  visible: number;
  /** Matching city-wide, ignoring the map viewport. */
  total: number;
};

type Groups = Record<Section, any[]>;

/** Fragment token for a filter the user emptied, as opposed to never set. */
const EMPTY_FILTER = '-';

@Injectable({
  providedIn: 'root'
})
export class StateService {

  workspaceId = signal<string>('');
  section = signal<Section>('all');
  mapScope = signal<MapScope>('city');
  /** Written only by MapComponent, on moveend. Never read back to move the camera. */
  mapBounds = signal<Bounds | null>(null);

  selectedId = signal<string | null>(null);
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

  filterSignals: Record<FilterKind, WritableSignal<string[] | null>> = {
    age_group: this.filterAgeGroup,
    health_subkind: this.filterHealthSubkind,
    community_subkind: this.filterCommunitySubkind,
    licensing: this.filterLicensing,
    subsidy: this.filterSubsidy,
    mentoring: this.filterMentoring,
  };

  /**
   * Unlicensed frameworks are hidden from מסגרות חינוך unless the user asks for them,
   * but the default must not shrink the headline הכל count — so it lives here as a
   * fallback rather than being written into filterLicensing.
   */
  effectiveLicensing = computed(() => this.filterLicensing() ?? DEFAULT_LICENSING);

  /** Predicates that apply regardless of section. */
  itemsCommon = computed(() => {
    const items = this.api.items();
    const ages = this.filterAgeGroup();
    if (!ages) {
      return items;
    }
    return items.filter((item) => item.resolved.age_group?.some((ag: string) => ages.includes(ag)) || false);
  });

  private groupsCity = computed(() => this.partition(this.itemsCommon()));

  private groupsViewport = computed<Groups | null>(() => {
    // mapScope is read before mapBounds on purpose: signal dependencies are tracked
    // dynamically, so panning while scoped to the city invalidates nothing.
    if (this.mapScope() !== 'map') {
      return null;
    }
    const bounds = this.mapBounds();
    if (!bounds) {
      return null;
    }
    const [west, south, east, north] = bounds;
    return this.partition(this.itemsCommon().filter((item) => {
      const { lng, lat } = item.resolved;
      return lng >= west && lng <= east && lat >= south && lat <= north;
    }));
  });

  private groups = computed(() => this.groupsViewport() ?? this.groupsCity());

  items = computed(() => this.groups()[this.section()]);

  /**
   * Every chip's count comes out of one partition, and none of them read section(),
   * so a category's count never depends on which category happens to be selected.
   */
  sectionCounts = computed<Record<Section, SectionCount>>(() => {
    const visible = this.groups();
    const total = this.groupsCity();
    const counts = {} as Record<Section, SectionCount>;
    for (const key of ['all', ...CONCRETE_SECTIONS] as Section[]) {
      counts[key] = { visible: visible[key].length, total: total[key].length };
    }
    return counts;
  });

  /** True when the count should render as `visible/total`. */
  scoped = computed(() => this.mapScope() === 'map' && this.mapBounds() !== null);
  resultCount = computed(() => this.sectionCounts()[this.section()]);

  /** Resolved against the full item set, so a deep link survives any active filter. */
  selectedItem = computed(() => {
    const id = this.selectedId();
    if (!id) {
      return null;
    }
    return this.api.items().find((item) => item.id === id) || null;
  });

  filterCount = computed(() => {
    const section = this.section();
    const kinds: FilterKind[] = [
      'age_group',
      ...(section === 'all' ? SECTIONS.flatMap((s) => s.filters) : sectionDef(section).filters),
    ];
    return kinds.filter((kind) => (this.appliedValues(kind)?.length || 0) > 0).length;
  });

  /**
   * `<section>[,<scope>]/<lng>/<lat>/<zoom>/<age>/<health>/<community>/<licensing>/<subsidy>/<mentoring>[/<id>]`
   *
   * Scope rides on segment 0 rather than taking a segment of its own: the id is
   * positional-last-and-optional, so an extra segment would make an 11-part fragment
   * ambiguous between an old link with an id and a new link without one. City scope
   * emits no suffix, so links made in the default scope stay byte-identical to old ones.
   */
  fragment = computed<string>(() => {
    const parts = [this.section() + (this.mapScope() === 'map' ? ',map' : '')];

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
      parts.push(filter === null ? '' : (filter.length > 0 ? filter.join(';') : EMPTY_FILTER));
    }

    const selectedId = this.selectedId();
    if (selectedId) {
      parts.push(selectedId);
    }

    return parts.join('/');
  });

  constructor(private router: Router, private route: ActivatedRoute, private api: ApiService, @Inject(DOCUMENT) private document: Document,
  ) {
    effect(() => {
      const fragment = this.fragment();
      this.router.navigate([], {
        relativeTo: this.route, fragment, queryParamsHandling: 'preserve',
      });
    });
    effect(() => {
      const workspace = this.api.workspace();
      const item = this.selectedItem();
      for (const key of ['og:url', 'twitter:url']) {
        const metaDescription = this.document.querySelector(`meta[property="${key}"]`);
        if (metaDescription) {
          metaDescription.setAttribute('content', `https://app.tafmap.org.il/${this.workspaceId()}`);
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

  private matchesSubFilters(item: any, kind: ConcreteSection, licensing: string[] | null): boolean {
    const resolved = item.resolved;
    if (kind === 'education') {
      if (licensing && licensing.length > 0 && !licensing.includes(resolved.license_status_code)) {
        return false;
      }
      const subsidy = this.filterSubsidy();
      if (subsidy && !subsidy.includes(resolved.subsidized ? 'yes' : 'no')) {
        return false;
      }
      const mentoring = this.filterMentoring();
      if (mentoring && !mentoring.includes(resolved.mentoring_type)) {
        return false;
      }
      return true;
    }
    const subKind = kind === 'health' ? this.filterHealthSubkind() : this.filterCommunitySubkind();
    return !subKind || subKind.includes(resolved.facility_sub_kind);
  }

  /**
   * One pass builds all four groups. Sub-filters are applied per item, keyed on that
   * item's own section, so a chip's count always predicts the length of the list you
   * get by clicking it. The licensing default is the single exception: it shapes the
   * education group but not `all`.
   */
  private partition(items: any[]): Groups {
    const groups: Groups = { all: [], education: [], health: [], community: [] };
    const sectionLicensing = this.effectiveLicensing();
    const allLicensing = this.filterLicensing();
    for (const item of items) {
      const kind = item.resolved?.facility_kind;
      if (!isConcreteSection(kind)) {
        continue;
      }
      const inSection = this.matchesSubFilters(item, kind, sectionLicensing);
      if (inSection) {
        groups[kind].push(item);
      }
      const inAll = kind === 'education' ? this.matchesSubFilters(item, kind, allLicensing) : inSection;
      if (inAll) {
        groups.all.push(item);
      }
    }
    return groups;
  }

  private parseSectionSegment(segment: string): { section: Section, scope: MapScope } {
    const [rawSection, rawScope] = (segment || '').split(',');
    const section: Section = rawSection === 'all' || isConcreteSection(rawSection) ? rawSection as Section : 'all';
    return { section, scope: rawScope === 'map' ? 'map' : 'city' };
  }

  updateStateFromFragment(fragment: string | null) {
    if (!fragment) {
      return;
    }
    let parts = fragment.split('/');
    const { section, scope } = this.parseSectionSegment(parts[0]);
    this.section.set(section);
    this.mapScope.set(scope);
    parts = parts.slice(1);

    if (parts.length >= 3) {
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      const zoom = parseFloat(parts[2]);
      if (lat && lng && zoom) {
        this.askZoom.set([lng, lat, zoom]);
      }
      parts = parts.slice(3);

      if (parts.length >= 6) {
        const values = (segment: string) => segment === EMPTY_FILTER ? [] : (segment ? segment.split(';') : null);
        this.filterAgeGroup.set(values(parts[0]));
        this.filterHealthSubkind.set(values(parts[1]));
        this.filterCommunitySubkind.set(values(parts[2]));
        this.filterLicensing.set(values(parts[3]));
        this.filterSubsidy.set(values(parts[4]));
        this.filterMentoring.set(values(parts[5]));
        parts = parts.slice(6);
        // A hand-trimmed url can leave a trailing empty segment; that is no selection.
        this.selectedId.set(parts[0] || null);
      }
    }
  }

  /**
   * What a filter is actually narrowing by right now — which is not always what the user
   * set, because מסגרות חינוך falls back to the licensing default. Both the pill row and
   * the filter sheet read through this so the default is visible wherever it applies.
   */
  appliedValues(kind: FilterKind): string[] | null {
    if (kind === 'licensing' && this.section() === 'education') {
      return this.effectiveLicensing();
    }
    return this.filterSignals[kind]();
  }

  clearFilter(kind: FilterKind) {
    // Nulling a defaulted licensing filter would just hand the default straight back, so
    // clearing it records an explicit empty selection instead. Empty means "match
    // everything" here, which is what an unset filter does anyway.
    this.filterSignals[kind].set(kind === 'licensing' ? [] : null);
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
