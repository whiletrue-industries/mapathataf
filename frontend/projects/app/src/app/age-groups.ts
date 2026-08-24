export type AgeGroup = {
  id: string;
  display: string;
  short: string;
};

export const AGE_GROUPS: AgeGroup[] = [
  { id: 'birth_to_1', display: 'לידה עד 1', short: '0-1' },
  { id: '1_to_2', display: '1-2', short: '1-2' },
  { id: '2_to_3', display: '2-3', short: '2-3' },
  { id: '3_to_6', display: '3-6', short: '3-6' },
];

const AGE_GROUP_IDS = AGE_GROUPS.map((ag) => ag.id);

// Stored values may be a legacy scalar (possibly the removed 'all_ages') or a list.
export function normalizeAgeGroups(value: any): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const values: string[] = Array.isArray(value) ? value : [value];
  const normalized = values.includes('all_ages') ? AGE_GROUP_IDS.slice() : values.filter((v) => AGE_GROUP_IDS.includes(v));
  return normalized.length ? normalized : undefined;
}

// Compact label for a facility's age range, e.g. "1-2, 2-3" or "הכל".
export function ageGroupLabel(ageGroups: string[] | undefined): string | null {
  if (!ageGroups?.length) {
    return null;
  }
  const known = AGE_GROUPS.filter((ag) => ageGroups.includes(ag.id));
  if (known.length === AGE_GROUPS.length) {
    return 'הכל';
  }
  return known.length ? known.map((ag) => ag.short).join(', ') : null;
}
