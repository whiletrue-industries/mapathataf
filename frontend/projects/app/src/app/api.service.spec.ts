import { resolveItem } from './api.service';

describe('resolveItem age_group resolution', () => {
  function itemWith(parts: any): any {
    return { user: {}, admin: {}, info: {}, official: [], ...parts };
  }

  it('resolves age_group as a normalized array from a legacy scalar', () => {
    const item = itemWith({ admin: { age_group: '2_to_3' } });
    resolveItem(item);
    expect(item.resolved.age_group).toEqual(['2_to_3']);
  });

  it('expands a stored legacy all_ages into all four age groups', () => {
    const item = itemWith({ admin: { age_group: 'all_ages' } });
    resolveItem(item);
    expect(item.resolved.age_group).toEqual(['birth_to_1', '1_to_2', '2_to_3', '3_to_6']);
  });

  it('prefers user over admin', () => {
    const item = itemWith({ user: { age_group: ['1_to_2'] }, admin: { age_group: ['2_to_3'] } });
    resolveItem(item);
    expect(item.resolved.age_group).toEqual(['1_to_2']);
  });

  it('does not let an empty array in user shadow a populated admin value', () => {
    const item = itemWith({ user: { age_group: [] }, admin: { age_group: ['3_to_6'] } });
    resolveItem(item);
    expect(item.resolved.age_group).toEqual(['3_to_6']);
  });

  it('leaves age_group undefined when nothing is stored', () => {
    const item = itemWith({});
    resolveItem(item);
    expect(item.resolved.age_group).toBeUndefined();
  });
});
