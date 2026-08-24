import { Component, computed, inject } from '@angular/core';
import { StateService } from '../../state.service';
import { SECTIONS, Section, sectionDef } from '../../sections';
import { activeFilterLabel, FILTER_DEFS, FilterKind } from '../../filter-defs';

type ActiveFilter = {
  kind: FilterKind;
  label: string;
};

@Component({
  selector: 'app-filter-panel',
  imports: [],
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.less'
})
export class FilterPanelComponent {

  state = inject(StateService);

  SECTIONS = SECTIONS;
  FILTER_DEFS = FILTER_DEFS;

  // גיל applies to every section; the rest belong to whichever category is selected.
  pillKinds = computed<FilterKind[]>(() => {
    const section = this.state.section();
    return ['age_group', ...(section === 'all' ? [] : sectionDef(section).filters)];
  });

  pillCount = computed<Record<string, number>>(() => {
    const counts: Record<string, number> = {};
    for (const kind of this.pillKinds()) {
      counts[kind] = this.state.appliedValues(kind)?.length || 0;
    }
    return counts;
  });

  activeFilters = computed<ActiveFilter[]>(() => {
    const active: ActiveFilter[] = [];
    for (const kind of this.pillKinds()) {
      const values = this.state.appliedValues(kind);
      if (values && values.length) {
        active.push({ kind, label: activeFilterLabel(kind, values) });
      }
    }
    return active;
  });

  selectSection(section: Section) {
    this.state.section.set(section);
  }

  // A chip is lit when it is part of what the list is showing — so in הכל mode, all of them.
  isLit(section: Section): boolean {
    const current = this.state.section();
    return current === 'all' || current === section;
  }

}
