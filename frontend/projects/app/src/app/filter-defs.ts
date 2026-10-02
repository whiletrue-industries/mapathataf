import { AGE_GROUPS } from './age-groups';

export type FilterKind = 'age_group' | 'health_subkind' | 'community_subkind' | 'licensing' | 'subsidy' | 'mentoring';

export type FilterOption = {
  value: string;
  label: string;
};

export type FilterDef = {
  kind: FilterKind;
  // Short label for the pill in the filter panel.
  label: string;
  options: FilterOption[];
};

export const LICENSING_OPTIONS: FilterOption[] = [
  { value: 'valid', label: 'רישיון בתוקף' },
  { value: 'in_progress', label: 'בתהליך רישוי' },
  { value: 'did_not_apply', label: 'לא הוגשה בקשה לרישוי' },
  { value: 'not_needed', label: 'מתחת ל-7 ילדים ואינו דורש רישוי' },
  { value: 'none', label: 'לא ידוע' },
];

// Applied to מסגרות חינוך when the user has not touched the licensing filter.
// Deliberately NOT applied to the 'all' section, so the headline count is the true total.
export const DEFAULT_LICENSING = ['valid', 'in_progress', 'not_needed'];

export const FILTER_DEFS: Record<FilterKind, FilterDef> = {
  age_group: {
    kind: 'age_group',
    label: 'גיל',
    options: AGE_GROUPS.map((ag) => ({ value: ag.id, label: ag.display })),
  },
  health_subkind: {
    kind: 'health_subkind',
    label: 'סוג',
    options: ['טיפת חלב', 'מרכז לגיל רך', 'הדרכה וייעוץ', 'אחר'].map((v) => ({ value: v, label: v })),
  },
  community_subkind: {
    kind: 'community_subkind',
    label: 'סוג',
    options: ['גן עם אמא', 'חוגים', 'גן או פארק', 'אחר'].map((v) => ({ value: v, label: v })),
  },
  licensing: {
    kind: 'licensing',
    label: 'רישוי',
    options: LICENSING_OPTIONS,
  },
  subsidy: {
    kind: 'subsidy',
    label: 'סבסוד',
    options: [
      { value: 'yes', label: 'סבסוד משרד העבודה' },
      { value: 'no', label: 'ללא סבסוד ממשלתי' },
    ],
  },
  mentoring: {
    kind: 'mentoring',
    label: 'הדרכה',
    options: [
      { value: 'municipal', label: 'עירונית' },
      { value: 'private', label: 'פרטית' },
      { value: 'not-mentored', label: 'אינו מודרך/לא ידוע' },
    ],
  },
};

export const ALL_AGES_LABEL = 'כל הגילאים';

export type FilterChip = {
  label: string;
  // The option the chip removes; null removes the whole filter.
  value: string | null;
};

/**
 * The removable chips for one active filter: one per selected option, in the filter's own
 * option order — except an age filter covering every group, which is a single
 * "כל הגילאים" chip, since it narrows nothing and four chips would be noise.
 */
export function activeFilterChips(kind: FilterKind, values: string[]): FilterChip[] {
  const def = FILTER_DEFS[kind];
  const selected = def.options.filter((option) => values.includes(option.value));
  if (kind === 'age_group' && selected.length === def.options.length) {
    return [{ label: ALL_AGES_LABEL, value: null }];
  }
  return selected.map((option) => ({ label: option.label, value: option.value }));
}
