import { AGE_GROUPS, normalizeAgeGroups } from './age-groups';

describe('AGE_GROUPS', () => {
  it('contains the four age groups in order', () => {
    expect(AGE_GROUPS.map((ag) => ag.id)).toEqual(['birth_to_1', '1_to_2', '2_to_3', '3_to_6']);
  });
});

describe('normalizeAgeGroups', () => {
  it('wraps a legacy scalar value into a one-element array', () => {
    expect(normalizeAgeGroups('1_to_2')).toEqual(['1_to_2']);
  });

  it('expands legacy all_ages into all four age groups', () => {
    expect(normalizeAgeGroups('all_ages')).toEqual(['birth_to_1', '1_to_2', '2_to_3', '3_to_6']);
  });

  it('keeps an array of known values as is', () => {
    expect(normalizeAgeGroups(['birth_to_1', '2_to_3'])).toEqual(['birth_to_1', '2_to_3']);
  });

  it('expands an array containing all_ages into all four age groups', () => {
    expect(normalizeAgeGroups(['1_to_2', 'all_ages'])).toEqual(['birth_to_1', '1_to_2', '2_to_3', '3_to_6']);
  });

  it('filters out unknown values', () => {
    expect(normalizeAgeGroups(['1_to_2', 'bogus'])).toEqual(['1_to_2']);
  });

  it('returns undefined for empty or missing values', () => {
    expect(normalizeAgeGroups(undefined)).toBeUndefined();
    expect(normalizeAgeGroups(null)).toBeUndefined();
    expect(normalizeAgeGroups('')).toBeUndefined();
    expect(normalizeAgeGroups([])).toBeUndefined();
    expect(normalizeAgeGroups(['bogus'])).toBeUndefined();
  });
});
