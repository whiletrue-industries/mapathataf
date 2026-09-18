import { AGE_GROUPS } from '../../../../app/src/app/age-groups';
import { FILTER_DEFS, LICENSING_OPTIONS } from '../../../../app/src/app/filter-defs';
import { layerPhotos } from '../../../../app/src/app/photos';
import { DEFAULT_FILTERS, ExtraField, filterItems, ItemFilters, neighborhoodOf, UNSET } from '../item-filter';

export type Scope = 'published' | 'active';

// Tones are class names; the colours themselves live in LESS, next to the palette.
export type Tone = 'good' | 'progress' | 'warn' | 'bad' | 'neutral' | 'c1' | 'c2' | 'c3' | 'c4'
  | 'education' | 'health' | 'community';

// A count plus the list filter that reproduces it. `filter` is what a click applies.
export type Figure = { key: string; label: string; count: number; filter: Partial<ItemFilters>; tone?: Tone };

export type Breakdown = { title: string; total: number; segments: Figure[]; isPrivate?: boolean };

export type CapacityBand = { label: string; total: number; available: number };

export type NeighborhoodRow = Figure & { places: number; available: number };

export type RecentUpdate = { id: string; name: string; updatedAt: string };

export type DashboardStats = {
  total: Figure;
  kinds: Figure[];
  education: Figure;
  // Education frameworks that are licensed, in the process, or exempt.
  licensed: number;
  attention: Figure[];
  breakdowns: Breakdown[];
  ages: Breakdown | null;
  capacity: { facilities: number; total: number; available: number; bands: CapacityBand[]; types: { label: string; count: number }[] } | null;
  neighborhoods: NeighborhoodRow[];
  noNeighborhood: Figure | null;
  owners: { updated: Figure; withPhoto: number; recent: RecentUpdate[] };
  subKinds: Breakdown[];
  syncedAt: string | null;
};

export const KIND_LABELS: { [key: string]: string } = {
  education: 'מסגרות חינוך',
  health: 'בריאות והתפתחות',
  community: 'פנאי וקהילה',
  'not-set': 'ללא סיווג',
};

const LICENSING_TONES: { [key: string]: Tone } = {
  valid: 'good', in_progress: 'progress', did_not_apply: 'bad', not_needed: 'c1', none: 'neutral',
};

const PLACES_BANDS = [
  { key: 'babies', label: 'תינוקות' },
  { key: 'toddlers', label: 'פעוטות' },
  { key: 'adults', label: 'בוגרים' },
];

const EDUCATION = { facilityKind: 'education' };

export function computeStats(items: any[], workspace: any, scope: Scope): DashboardStats {
  const base: Partial<ItemFilters> = scope === 'published' ? { appPublication: 'published' } : {};
  const select = (filter: Partial<ItemFilters>) => filterItems(items, { ...DEFAULT_FILTERS, ...filter });

  const figure = (key: string, label: string, filter: Partial<ItemFilters>, tone?: Tone, scoped = true): Figure => {
    filter = scoped ? { ...base, ...filter } : filter;
    return { key, label, count: select(filter).length, filter, tone };
  };
  const extra = (field: ExtraField, value: string, label: string, title: string, tone: Tone, more: Partial<ItemFilters> = EDUCATION) =>
    figure(value, label, { ...more, extra: { field, value, label: `${title}: ${label}` } }, tone);
  const breakdown = (title: string, segments: Figure[], isPrivate = false): Breakdown => ({
    title, segments: segments.filter(s => s.count > 0), total: segments.reduce((sum, s) => sum + s.count, 0), isPrivate,
  });

  const inScope = select(base);
  const total = figure('all', 'מענים', {});
  const kinds = ['education', 'health', 'community', 'not-set']
    .map(kind => figure(kind, KIND_LABELS[kind], { facilityKind: kind }, kind === 'not-set' ? 'neutral' : kind as Tone))
    .filter(f => f.count > 0);
  const education = figure('education', KIND_LABELS['education'], EDUCATION);

  const licensing = breakdown('רישוי', LICENSING_OPTIONS.map(option =>
    figure(option.value, option.label, { ...EDUCATION, licensingStatus: option.value }, LICENSING_TONES[option.value])));
  const licensed = licensing.segments.filter(s => ['valid', 'in_progress', 'not_needed'].includes(s.key))
    .reduce((sum, s) => sum + s.count, 0);

  const breakdowns = [
    licensing,
    breakdown('הדרכה פדגוגית', [
      figure('municipal', 'הדרכה עירונית', { ...EDUCATION, mentoringType: 'municipal' }, 'c1'),
      figure('private', 'הדרכה פרטית', { ...EDUCATION, mentoringType: 'private' }, 'c2'),
      figure('not-mentored', 'אינו מודרך / לא ידוע', { ...EDUCATION, mentoringType: 'not-mentored' }, 'neutral'),
    ]),
    breakdown('בעלות', [
      extra('owner_kind', 'national', 'רשת ארצית', 'בעלות', 'c1'),
      extra('owner_kind', 'municipal', 'רשת עירונית', 'בעלות', 'c2'),
      extra('owner_kind', 'private', 'פרטי', 'בעלות', 'c3'),
      extra('owner_kind', UNSET, 'לא הוזן', 'בעלות', 'neutral'),
    ]),
    breakdown('סבסוד', [
      extra('subsidized', 'yes', 'סבסוד משרד העבודה', 'סבסוד', 'c1'),
      extra('subsidized', 'no', 'ללא סבסוד ממשלתי', 'סבסוד', 'neutral'),
    ]),
    breakdown('מיגון', [
      extra('safe_room', 'safe_room', 'ממ"ד', 'מיגון', 'good'),
      extra('safe_room', 'standard_shelter', 'מקלט תקני', 'מיגון', 'c1'),
      extra('safe_room', 'no_shelter', 'ללא מרחב מוגן', 'מיגון', 'bad'),
      extra('safe_room', 'unknown', 'לא ידוע', 'מיגון', 'warn'),
      extra('safe_room', UNSET, 'לא הוזן', 'מיגון', 'neutral'),
    ], true),
  ].filter(b => b.total > 0);

  // Age groups overlap (most frameworks take several), so this is never a part-to-whole.
  const ageSegments = AGE_GROUPS.map(ag => extra('age_group', ag.id, ag.display, 'גילאים', 'c1'));
  const ages = ageSegments.some(s => s.count > 0)
    ? { title: 'גילאים', total: education.count, segments: ageSegments } : null;

  const attention = [
    // Hidden items are a to-do whatever the scope, so this one ignores `base`.
    figure('hidden', 'מענים מוסתרים מהמפה – כדאי לבדוק מדוע', { appPublication: 'hidden' }, undefined, false),
    figure('phone', 'מענים ללא מספר טלפון', { missing: 'phone' }),
    figure('location', 'מענים שמיקומם במפה חסר או דורש בדיקה', { missing: 'location' }),
    figure('age_group', 'מענים שלא הוגדרו להם גילאים', { missing: 'age_group' }),
    ...(workspace?.neighborhoods?.length ? [figure('neighborhood', 'מענים שלא שויכו לשכונה', { missing: 'neighborhood' })] : []),
    figure('did_not_apply', 'מסגרות חינוך שלא הגישו בקשה לרישוי', { ...EDUCATION, licensingStatus: 'did_not_apply' }),
    figure('license_unknown', 'מסגרות חינוך שסטטוס הרישוי שלהן לא ידוע', { ...EDUCATION, licensingStatus: 'none' }),
    figure('no_shelter', 'מסגרות חינוך ללא מרחב מוגן',
      { ...EDUCATION, extra: { field: 'safe_room', value: 'no_shelter', label: 'מיגון: ללא מרחב מוגן' } }),
  ].filter(f => f.count > 0);

  let facilities = 0;
  const bands = PLACES_BANDS.map(band => ({ label: band.label, total: 0, available: 0 }));
  const types: { [key: string]: number } = {};
  const placesOf = (item: any) => {
    let total = 0, available = 0;
    for (const official of (item.official || []).filter((o: any) => o.source === 'mol')) {
      PLACES_BANDS.forEach((band, i) => {
        const t = Number(official[`total_places_${band.key}`]) || 0;
        const a = Number(official[`available_places_${band.key}`]) || 0;
        bands[i].total += t;
        bands[i].available += a;
        total += t;
        available += a;
      });
      facilities++;
      const type = official.facility_type || 'אחר';
      types[type] = (types[type] || 0) + 1;
    }
    return { total, available };
  };

  const rows: { [name: string]: { places: number; available: number } } = {};
  let placesTotal = 0, placesAvailable = 0;
  for (const item of inScope) {
    const places = placesOf(item);
    placesTotal += places.total;
    placesAvailable += places.available;
    const name = neighborhoodOf(item);
    rows[name] = rows[name] || { places: 0, available: 0 };
    rows[name].places += places.total;
    rows[name].available += places.available;
  }
  const capacity = placesTotal > 0 ? {
    facilities, total: placesTotal, available: placesAvailable, bands,
    types: Object.entries(types).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
  } : null;

  const byNeighborhood = (name: string, label: string): NeighborhoodRow => {
    const filter: Partial<ItemFilters> = { extra: { field: 'neighborhood', value: name, label: `שכונה: ${label}` } };
    return {
      ...figure(name, label, filter),
      places: rows[name]?.places || 0,
      available: rows[name]?.available || 0,
    };
  };
  const hasNeighborhoods = Object.keys(rows).some(name => name !== UNSET);
  const neighborhoods = Object.keys(rows).filter(name => name !== UNSET)
    .map(name => byNeighborhood(name, name))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const noNeighborhood = hasNeighborhoods && rows[UNSET] ? figure(UNSET, 'ללא שכונה', { missing: 'neighborhood' }) : null;

  const recent = inScope.filter(item => item.user?.updated_at)
    .sort((a, b) => b.user.updated_at.localeCompare(a.user.updated_at))
    .slice(0, 5)
    .map(item => ({ id: item.id, name: item.resolved?.name || '', updatedAt: item.user.updated_at }));

  // Tones follow the option's fixed position, not its rank, so a colour keeps meaning the same sub-kind.
  const subKinds = (['health', 'community'] as const).map(kind => {
    const options = FILTER_DEFS[`${kind}_subkind`].options.map(option => option.value);
    // An item whose kind was changed keeps the sub-kind of its old one; count it rather than lose it.
    const strays = select({ ...base, facilityKind: kind }).map(item => item.resolved?.facility_sub_kind)
      .filter((value, i, all) => value && !options.includes(value) && all.indexOf(value) === i);
    return breakdown(KIND_LABELS[kind], [
      ...options.map((value, i) => extra('sub_kind', value, value, 'סוג', `c${Math.min(i, 3) + 1}` as Tone, { facilityKind: kind })),
      ...strays.map(value => extra('sub_kind', value, value, 'סוג', 'warn', { facilityKind: kind })),
      extra('sub_kind', UNSET, 'לא הוזן', 'סוג', 'neutral', { facilityKind: kind }),
    ]);
  }).filter(b => b.total > 0);

  const syncedAt = items.reduce((max: string | null, item) =>
    item.info?.updated_at && (!max || item.info.updated_at > max) ? item.info.updated_at : max, null);

  return {
    total, kinds, education,
    licensed,
    attention, breakdowns, ages, capacity, neighborhoods, noNeighborhood,
    owners: {
      updated: figure('owners', 'בעלי מסגרות שעדכנו פרטים', { userUpdated: 'updated' }),
      withPhoto: inScope.filter(item => layerPhotos(item.user).length > 0).length,
      recent,
    },
    subKinds,
    syncedAt,
  };
}
