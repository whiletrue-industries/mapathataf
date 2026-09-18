// The single predicate behind the item list. The dashboard counts with it too, so a figure
// there always equals the length of the list its click leads to.

export type ExtraField = 'owner_kind' | 'subsidized' | 'safe_room' | 'age_group' | 'neighborhood' | 'sub_kind';

// A filter the list has no <select> for; set by dashboard drill-downs and shown as a chip.
export type ExtraFilter = { field: ExtraField; value: string; label: string };

export type ItemFilters = {
  facilityKind: string;
  itemSource: string;
  appPublication: string;
  adminUpdated: string;
  userUpdated: string;
  licensingStatus: string;
  mentoringType: string;
  missing: string;
  searchQuery: string;
  extra: ExtraFilter | null;
};

export const DEFAULT_FILTERS: ItemFilters = {
  facilityKind: 'all',
  itemSource: 'all',
  appPublication: 'all',
  adminUpdated: 'all',
  userUpdated: 'all',
  licensingStatus: 'all',
  mentoringType: 'all',
  missing: 'all',
  searchQuery: '',
  extra: null,
};

export const UNSET = 'unset';

export const MISSING_OPTIONS = [
  { id: 'phone', display: 'טלפון' },
  { id: 'neighborhood', display: 'שכונה' },
  { id: 'age_group', display: 'גילאים' },
  { id: 'location', display: 'מיקום לבדיקה' },
];

export function isDeleted(item: any): boolean {
  return !!item.admin?._private_deleted;
}

export function isPublished(item: any): boolean {
  return !!item.admin?.app_publication;
}

export function safeRoomOf(item: any): string {
  return item.user?._private_safe_room || item.admin?._private_safe_room || UNSET;
}

export function neighborhoodOf(item: any): string {
  return item.admin?.neighborhood || UNSET;
}

// No pin at all, an amended address the geocoder rejected, or a pipeline pin it flagged itself.
export function locationNeedsReview(item: any): boolean {
  if (!item.resolved?.lat || !item.resolved?.lng) {
    return true;
  }
  const status = item.admin?._private_geocoding_status;
  if (status) {
    return status !== 'OK';
  }
  return !!item.info?.geocode_suspicious && !item.admin?.lat;
}

const MISSING: { [key: string]: (item: any) => boolean } = {
  phone: (item) => !item.resolved?.phone,
  neighborhood: (item) => neighborhoodOf(item) === UNSET,
  age_group: (item) => !item.resolved?.age_group?.length,
  location: locationNeedsReview,
};

const EXTRA: { [key in ExtraField]: (item: any, value: string) => boolean } = {
  owner_kind: (item, value) => (item.resolved?.owner_kind || UNSET) === value,
  subsidized: (item, value) => !!item.resolved?.subsidized === (value === 'yes'),
  safe_room: (item, value) => safeRoomOf(item) === value,
  age_group: (item, value) => (item.resolved?.age_group || []).includes(value),
  neighborhood: (item, value) => neighborhoodOf(item) === value,
  sub_kind: (item, value) => (item.resolved?.facility_sub_kind || UNSET) === value,
};

export function filterItems(items: any[], filters: ItemFilters): any[] {
  const f = filters;
  items = items.filter(item => isDeleted(item) === (f.appPublication === 'recycled'));
  if (f.facilityKind !== 'all') {
    items = items.filter(item => item.resolved.facility_kind === f.facilityKind);
  }
  if (f.itemSource !== 'all') {
    items = items.filter(item => (!!item.official && item.official.length > 0) === (f.itemSource === 'official'));
  }
  if (f.appPublication !== 'all' && f.appPublication !== 'recycled') {
    items = items.filter(item => isPublished(item) === (f.appPublication === 'published'));
  }
  if (f.adminUpdated !== 'all') {
    items = items.filter(item => !!item.admin?.updated_at === (f.adminUpdated === 'updated'));
  }
  if (f.userUpdated !== 'all') {
    items = items.filter(item => !!item.user?.updated_at === (f.userUpdated === 'updated'));
  }
  // Licensing and mentoring only mean something for education, and the list only offers them there.
  if (f.licensingStatus !== 'all' && f.facilityKind === 'education') {
    items = items.filter(item => item.resolved.license_status_code === f.licensingStatus);
  }
  if (f.mentoringType !== 'all' && f.facilityKind === 'education') {
    items = items.filter(item => item.resolved.mentoring_type === f.mentoringType);
  }
  const missing = MISSING[f.missing];
  if (missing) {
    items = items.filter(missing);
  }
  const extra = f.extra;
  if (extra && EXTRA[extra.field]) {
    items = items.filter(item => EXTRA[extra.field](item, extra.value));
  }
  if (f.searchQuery) {
    const query = f.searchQuery.toLowerCase();
    items = items.filter(item => {
      return item.resolved?.name?.toLowerCase().includes(query) ||
        [item.resolved?.address, item.resolved?.formatted_address, item.resolved?.original_address]
          .some((address: string) => address && address.toLowerCase().includes(query));
    });
  }
  return items;
}
