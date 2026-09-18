import { resolveItem } from '../../../app/src/app/api.service';
import { DEFAULT_FILTERS, filterItems, ItemFilters, locationNeedsReview } from './item-filter';

// Mirrors what ApiService.prepare() does to an item before anything reads it.
export function makeItem(id: string, parts: any = {}): any {
  const item = { id, official: [], info: {}, user: {}, ...parts, admin: { app_publication: true, ...(parts.admin || {}) } };
  resolveItem(item);
  return item;
}

const located = { lat: 31.9, lng: 34.8 };

describe('filterItems', () => {
  const items = [
    makeItem('edu-valid', { info: { facility_kind: 'education', ...located }, official: [{ source: 'moe', license_status: 'רישיון בתוקף', phone: '08-1' }] }),
    makeItem('edu-hidden', { info: { facility_kind: 'education', ...located }, admin: { app_publication: false, mentoring_type: 'not_mentored' } }),
    makeItem('health', { info: { facility_kind: 'health', ...located }, admin: { neighborhood: 'מרכז', phone: '08-2' }, user: { updated_at: '2026-01-01' } }),
    makeItem('deleted', { info: { facility_kind: 'education' }, admin: { _private_deleted: true } }),
  ];
  const ids = (filters: Partial<ItemFilters>) => filterItems(items, { ...DEFAULT_FILTERS, ...filters }).map(item => item.id);

  it('leaves deleted items to the recycle bin only', () => {
    expect(ids({})).toEqual(['edu-valid', 'edu-hidden', 'health']);
    expect(ids({ appPublication: 'recycled' })).toEqual(['deleted']);
  });

  it('separates published from hidden', () => {
    expect(ids({ appPublication: 'published' })).toEqual(['edu-valid', 'health']);
    expect(ids({ appPublication: 'hidden' })).toEqual(['edu-hidden']);
  });

  it('applies licensing and mentoring only under education', () => {
    expect(ids({ licensingStatus: 'valid' })).toEqual(['edu-valid', 'edu-hidden', 'health']);
    expect(ids({ facilityKind: 'education', licensingStatus: 'valid' })).toEqual(['edu-valid']);
    expect(ids({ facilityKind: 'education', mentoringType: 'not-mentored' })).toEqual(['edu-valid', 'edu-hidden']);
  });

  it('finds items with missing details', () => {
    expect(ids({ missing: 'phone' })).toEqual(['edu-hidden']);
    expect(ids({ missing: 'neighborhood' })).toEqual(['edu-valid', 'edu-hidden']);
    expect(ids({ missing: 'age_group' })).toEqual(['edu-valid', 'edu-hidden', 'health']);
  });

  it('applies an extra filter, with unset as a value of its own', () => {
    expect(ids({ extra: { field: 'subsidized', value: 'no', label: '' } })).toEqual(['edu-valid', 'edu-hidden', 'health']);
    expect(ids({ extra: { field: 'neighborhood', value: 'מרכז', label: '' } })).toEqual(['health']);
    expect(ids({ extra: { field: 'safe_room', value: 'unset', label: '' } }).length).toBe(3);
  });

  it('combines filters', () => {
    expect(ids({ userUpdated: 'updated', facilityKind: 'education' })).toEqual([]);
    expect(ids({ userUpdated: 'updated', searchQuery: 'x' })).toEqual([]);
  });
});

describe('locationNeedsReview', () => {
  it('flags an item with no pin', () => {
    expect(locationNeedsReview(makeItem('a'))).toBeTrue();
  });

  it('flags an amended address the geocoder rejected, even when the pipeline pin remains', () => {
    expect(locationNeedsReview(makeItem('a', { info: located, admin: { _private_geocoding_status: 'ZERO_RESULTS' } }))).toBeTrue();
    expect(locationNeedsReview(makeItem('a', { info: located, admin: { _private_geocoding_status: 'OK', ...located } }))).toBeFalse();
  });

  it('flags a suspicious pipeline pin until the admin places their own', () => {
    expect(locationNeedsReview(makeItem('a', { info: { ...located, geocode_suspicious: 'city' } }))).toBeTrue();
    expect(locationNeedsReview(makeItem('a', { info: located }))).toBeFalse();
  });
});
