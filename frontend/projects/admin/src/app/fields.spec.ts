import { Field, fieldValue } from './fields';

describe('fieldValue', () => {
  const OPTIONS = [
    { id: 'birth_to_1', display: 'לידה עד 1' },
    { id: '1_to_2', display: '1-2' },
    { id: '2_to_3', display: '2-3' },
    { id: '3_to_6', display: '3-6' },
  ];
  const multiEnumField: Field = { name: 'age_group', type: 'multi-enum', options: OPTIONS };
  const enumField: Field = { name: 'age_group', type: 'enum', options: OPTIONS };

  it('joins the displays of selected multi-enum values in option order', () => {
    expect(fieldValue({ age_group: ['2_to_3', 'birth_to_1'] }, multiEnumField)).toBe('לידה עד 1, 2-3');
  });

  it('shows לא הוזן for an empty or missing multi-enum value', () => {
    expect(fieldValue({ age_group: [] }, multiEnumField)).toBe('לא הוזן');
    expect(fieldValue({}, multiEnumField)).toBe('לא הוזן');
  });

  it('ignores unknown ids in a multi-enum value', () => {
    expect(fieldValue({ age_group: ['bogus', '1_to_2'] }, multiEnumField)).toBe('1-2');
  });

  it('still resolves single enum values', () => {
    expect(fieldValue({ age_group: '1_to_2' }, enumField)).toBe('1-2');
    expect(fieldValue({ age_group: 'bogus' }, enumField)).toBe('לא הוזן');
  });
});
