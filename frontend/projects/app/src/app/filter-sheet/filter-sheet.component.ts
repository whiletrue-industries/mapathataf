import { Component, computed, inject } from '@angular/core';
import { StateService } from '../state.service';
import { FILTER_DEFS } from '../filter-defs';

@Component({
  selector: 'app-filter-sheet',
  imports: [],
  templateUrl: './filter-sheet.component.html',
  styleUrl: './filter-sheet.component.less'
})
export class FilterSheetComponent {

  state = inject(StateService);

  kind = computed(() => this.state.filterOptions());
  def = computed(() => {
    const kind = this.kind();
    return kind ? FILTER_DEFS[kind] : null;
  });
  currentValues = computed<string[] | null>(() => {
    const kind = this.kind();
    return kind ? this.state.appliedValues(kind) : null;
  });

  toggleValue(value: string) {
    const kind = this.kind();
    if (!kind) {
      return;
    }
    const selected = this.currentValues() || [];
    const next = selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value];
    // An empty selection means "no filter" everywhere except licensing, where it has to
    // stay explicit so the מסגרות חינוך default does not reappear.
    if (next.length === 0) {
      this.state.clearFilter(kind);
    } else {
      this.state.filterSignals[kind].set(next);
    }
  }

  save() {
    this.state.filterOptions.set(null);
  }

  clear() {
    const kind = this.kind();
    if (kind) {
      this.state.clearFilter(kind);
    }
    this.state.filterOptions.set(null);
  }
}
