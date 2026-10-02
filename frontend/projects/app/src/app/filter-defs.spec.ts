import { activeFilterChips, ALL_AGES_LABEL } from './filter-defs';

describe('activeFilterChips', () => {
  it('gives each selected option its own chip, in option order', () => {
    expect(activeFilterChips('age_group', ['1_to_2', 'birth_to_1'])).toEqual([
      { label: 'לידה עד 1', value: 'birth_to_1' },
      { label: '1-2', value: '1_to_2' },
    ]);
  });

  it('collapses an age filter covering every group into one chip for the whole filter', () => {
    expect(activeFilterChips('age_group', ['birth_to_1', '1_to_2', '2_to_3', '3_to_6']))
      .toEqual([{ label: ALL_AGES_LABEL, value: null }]);
  });

  it('splits a full licensing selection like any other filter', () => {
    expect(activeFilterChips('licensing', ['valid', 'in_progress', 'did_not_apply', 'not_needed', 'none'])
      .map((chip) => chip.value)).toEqual(['valid', 'in_progress', 'did_not_apply', 'not_needed', 'none']);
  });

  it('ignores values the filter does not offer', () => {
    expect(activeFilterChips('subsidy', ['bogus'])).toEqual([]);
  });
});
