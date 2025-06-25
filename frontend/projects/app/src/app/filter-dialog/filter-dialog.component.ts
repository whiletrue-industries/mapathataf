import { Component, computed, inject } from '@angular/core';
import { StateService } from '../state.service';

type OptionTuple = {
  value: string;
  label: string;
};

@Component({
  selector: 'app-filter-dialog',
  imports: [],
  templateUrl: './filter-dialog.component.html',
  styleUrl: './filter-dialog.component.less'
})
export class FilterDialogComponent {

  state = inject(StateService);

  currentlySelected = computed(() => {
    const age_group = this.state.filterAgeGroup;
    const health_subkind = this.state.filterHealthSubkind;
    const community_subkind = this.state.filterCommunitySubkind;
    const licensing = this.state.filterLicensing;
    const subsidy = this.state.filterSubsidy;
    const guidance = this.state.filterGuidance;
    switch (this.state.filterOptions()) {
      case 'age_group':
        return age_group;
      case 'health_subkind':
        return health_subkind;
      case 'community_subkind':
        return community_subkind;
      case 'licensing':
        return licensing;
      case 'subsidy':
        return subsidy;
      case 'guidance':
        return guidance;
      default:
        return null;
    }
  });
  currentValues = computed<string[] | null>(() => {
    const current = this.currentlySelected();
    if (current) {
      return current();
    }
    return null;
  });

  options = computed<OptionTuple[]>(() => {
    switch (this.state.filterOptions()) {
      case 'age_group':
        return [
          { value: 'birth_to_1', label: 'לידה עד 1' },
          { value: '1_to_2', label: '1-2' },
          { value: '2_to_3', label: '2-3' },
          { value: 'all_ages', label: 'כל הגילאים' }
        ];
      case 'health_subkind':
        return [
          { value: 'טיפת חלב', label: 'טיפת חלב' },
          { value: 'מרכז לגיל רך', label: 'מרכז לגיל רך' },
          { value: 'הדרכה וייעוץ', label: 'הדרכה וייעוץ' },
          { value: 'אחר', label: 'אחר' }
        ];
      case 'community_subkind':
        return [
          { value: 'גן עם אמא', label: 'גן עם אמא' },
          { value: 'חוגים', label: 'חוגים' },
          { value: 'גן או פארק', label: 'גן או פארק' },
          { value: 'אחר', label: 'אחר' }
        ];
      case 'licensing':
        return [
          { value: 'did_not_apply', label: 'לא הוגשה בקשה לרישוי' },
          { value: 'valid', label: 'רישיון בתוקף' },
          { value: 'in_progress', label: 'בתהליך רישוי' },
          { value: 'not_needed', label: 'מתחת ל-7 ילדים ואינו דורש רישוי' },
          { value: 'none', label: 'לא ידוע' }
        ];
      case 'subsidy':
        return [
          { value: 'yes', label: 'מסובסד' },
          { value: 'no', label: 'לא מסובסד' },
        ];
      case 'guidance':
        return [
          { value: 'municipal', label: 'עירונית' },
          { value: 'private', label: 'פרטית' },
        ];
      default:
        return [];
    }
  });

  toggleValue(value: string) {
    const current = this.currentlySelected();
    if (current) {
      const values = current();
      if (values && values.includes(value)) {
        // Remove the value
        current.update((vv) => {
          const ret = (vv || []).filter(v => v !== value);
          if (ret.length === 0) {
            return null; // Clear the filter if no values left
          }
          return ret;
        });
      } else {
        // Add the value
        current.update((vv) => [...(vv || []), value]);
      }
    }
  }

  save() {
    this.state.filterOptions.set(null);
  }

  clear() {
    const current = this.currentlySelected();
    if (current) {
      current.set(null);
    }
    this.state.filterOptions.set(null);
  }
}
