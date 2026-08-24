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

/**
 * One removable chip stands for one active filter, so its label has to summarise the
 * whole selection: the value itself when there is only one, "כל הגילאים" when an age
 * filter covers every group, and otherwise the filter's own name.
 */
export function activeFilterLabel(kind: FilterKind, values: string[]): string {
  const def = FILTER_DEFS[kind];
  const selected = def.options.filter((option) => values.includes(option.value));
  if (kind === 'age_group' && selected.length === def.options.length) {
    return ALL_AGES_LABEL;
  }
  if (selected.length === 1) {
    return selected[0].label;
  }
  return def.label;
}
