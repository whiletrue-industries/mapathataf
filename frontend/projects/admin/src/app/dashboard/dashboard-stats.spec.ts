import { DEFAULT_FILTERS, filterItems } from '../item-filter';
import { makeItem } from '../item-filter.spec';
import { Breakdown, computeStats, DashboardStats, Figure } from './dashboard-stats';

const located = { lat: 31.9, lng: 34.8 };
const education = { facility_kind: 'education', ...located };
const mol = (babies: number, freeBabies: number, toddlers = 0, freeToddlers = 0) => ({
  source: 'mol', facility_type: 'מעון',
  total_places_babies: babies, available_places_babies: freeBabies,
  total_places_toddlers: toddlers, available_places_toddlers: freeToddlers,
  total_places_adults: 0, available_places_adults: 0,
});

const items = [
  makeItem('a', { info: education, official: [{ source: 'moe', license_status: 'רישיון בתוקף' }, mol(10, 4, 20, 5)],
    admin: { neighborhood: 'צפון', mentoring_type: 'municipal', age_group: ['birth_to_1', '1_to_2'], _private_safe_room: 'no_shelter' } }),
  makeItem('b', { info: education, official: [{ source: 'moe', license_status: 'בתהליך רישוי' }],
    admin: { neighborhood: 'צפון', mentoring_type: 'not_mentored', age_group: ['1_to_2'] }, user: { updated_at: '2026-05-01', name: 'גן ב' } }),
  makeItem('c', { info: education, official: [mol(6, 6)], admin: { app_publication: false } }),
  makeItem('d', { info: { facility_kind: 'health', facility_sub_kind: 'טיפת חלב', updated_at: '2026-09-18T00:00:00' }, user: { updated_at: '2026-06-01' } }),
  makeItem('gone', { info: education, admin: { _private_deleted: true }, official: [mol(100, 100)] }),
];
const workspace = { neighborhoods: ['צפון', 'דרום'] };

function figures(stats: DashboardStats): Figure[] {
  const breakdowns: Breakdown[] = [...stats.breakdowns, ...stats.subKinds, ...(stats.ages ? [stats.ages] : [])];
  return [
    stats.total, stats.education, stats.owners.updated, ...stats.kinds, ...stats.attention, ...stats.neighborhoods,
    ...(stats.noNeighborhood ? [stats.noNeighborhood] : []),
    ...breakdowns.flatMap(b => b.segments),
  ];
}

describe('computeStats', () => {
  it('counts only published items by default, and never deleted ones', () => {
    expect(computeStats(items, workspace, 'published').total.count).toBe(3);
    expect(computeStats(items, workspace, 'active').total.count).toBe(4);
  });

  // The invariant the whole dashboard leans on: a figure predicts the list its click opens.
  it('gives every figure the filter that reproduces its count', () => {
    for (const scope of ['published', 'active'] as const) {
      for (const figure of figures(computeStats(items, workspace, scope))) {
        expect(filterItems(items, { ...DEFAULT_FILTERS, ...figure.filter }).length)
          .withContext(`${scope}/${figure.key}`).toBe(figure.count);
      }
    }
  });

  it('reports hidden items whatever the scope', () => {
    const hidden = computeStats(items, workspace, 'published').attention.find(f => f.key === 'hidden');
    expect(hidden?.count).toBe(1);
  });

  it('sums capacity over the scope, per band and per neighbourhood', () => {
    const published = computeStats(items, workspace, 'published');
    expect(published.capacity).toEqual(jasmine.objectContaining({ facilities: 1, total: 30, available: 9 }));
    expect(published.capacity?.bands[0]).toEqual({ label: 'תינוקות', total: 10, available: 4 });
    expect(published.neighborhoods[0]).toEqual(jasmine.objectContaining({ label: 'צפון', count: 2, places: 30, available: 9 }));
    expect(computeStats(items, workspace, 'active').capacity?.total).toBe(36);
  });

  it('folds both spellings of not-mentored into one segment', () => {
    const mentoring = computeStats(items, workspace, 'published').breakdowns.find(b => b.title === 'הדרכה פדגוגית');
    expect(mentoring?.segments.map(s => [s.key, s.count])).toEqual([['municipal', 1], ['not-mentored', 1]]);
  });

  it('counts a framework under every age group it serves', () => {
    const ages = computeStats(items, workspace, 'published').ages;
    expect(ages?.segments.map(s => s.count)).toEqual([1, 2, 0, 0]);
  });

  it('counts photos in either the current or the legacy field', () => {
    const withPhotos = [
      makeItem('new', { info: education, user: { photos: ['data:image/jpeg;base64,a'] } }),
      makeItem('old', { info: education, user: { photo: 'data:image/jpeg;base64,b' } }),
      makeItem('none', { info: education, user: { photos: [] } }),
    ];
    expect(computeStats(withPhotos, {}, 'published').owners.withPhoto).toBe(2);
  });

  it('lists owner updates newest first and finds the last sync', () => {
    const stats = computeStats(items, workspace, 'published');
    expect(stats.owners.recent.map(r => r.id)).toEqual(['d', 'b']);
    expect(stats.owners.recent[1].name).toBe('גן ב');
    expect(stats.syncedAt).toBe('2026-09-18T00:00:00');
  });

  it('keeps a sub-kind left over from an item\'s previous kind in the breakdown', () => {
    const stray = makeItem('s', { info: located, admin: { facility_kind: 'community', facility_sub_kind: 'הדרכה וייעוץ' } });
    const community = computeStats([stray], {}, 'published').subKinds.find(b => b.title === 'פנאי וקהילה');
    expect(community?.total).toBe(1);
    expect(community?.segments.map(s => s.key)).toEqual(['הדרכה וייעוץ']);
  });

  it('leaves out whole sections a city has no data for', () => {
    const bare = computeStats([makeItem('x', { info: education })], {}, 'published');
    expect(bare.capacity).toBeNull();
    expect(bare.ages).toBeNull();
    expect(bare.neighborhoods).toEqual([]);
    expect(bare.noNeighborhood).toBeNull();
    expect(bare.subKinds).toEqual([]);
    expect(bare.attention.some(f => f.key === 'neighborhood')).toBeFalse();
    expect(computeStats([], {}, 'published').total.count).toBe(0);
  });
});
