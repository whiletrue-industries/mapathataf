import { ageGroupLabel } from '../age-groups';
import { FILTER_DEFS } from '../filter-defs';

export type DetailRow = {
  /** Suffix of an `.icon-*` class in the stylesheet. */
  icon: string;
  label: string;
  value: string;
  href?: string;
};

type FieldDef = {
  /** Facility kinds the field belongs to; a field without it belongs to all of them. */
  kinds?: string[];
  row: (resolved: any) => Partial<DetailRow> & Pick<DetailRow, 'icon' | 'label'>;
};

const EDUCATION = ['education'];

function mentoringLabel(value: string): string | undefined {
  // 'not-mentored' is what resolveItem() falls back to when nothing was entered
  if (value === 'not-mentored') {
    return undefined;
  }
  return FILTER_DEFS.mentoring.options.find((option) => option.value === value)?.label;
}

/**
 * The detail rows of the item sheet, in the one fixed order they are shown in (the facility
 * name leads as the sheet's title, the photos close it after the action buttons). A field is
 * left out entirely when it does not belong to the facility's kind - licensing on a health
 * facility, say - or when nobody entered a value for it.
 */
const FIELDS: FieldDef[] = [
  {
    kinds: EDUCATION,
    row: (r) => ({
      icon: 'licensing-' + (r.license_status_code || 'none'),
      label: r.school_year ? `רישוי (${r.school_year})` : 'רישוי',
      // code 'none' is resolveItem()'s "לא ידוע" placeholder for a status nobody entered
      value: r.license_status_code === 'none' ? undefined : r.license_status,
    }),
  },
  { kinds: EDUCATION, row: (r) => ({ icon: 'library-books', label: 'סמל מעון', value: r.symbol_text }) },
  { kinds: EDUCATION, row: (r) => ({ icon: 'library-books', label: 'הדרכת צוות', value: mentoringLabel(r.mentoring_type) }) },
  { row: (r) => ({ icon: 'location-city', label: 'כתובת', value: r.address }) },
  { row: (r) => ({ icon: 'person', label: 'גיל', value: ageGroupLabel(r.age_group) || undefined }) },
  { row: (r) => ({ icon: 'access-time', label: 'שעות פעילות', value: r.activity_hours }) },
  { row: (r) => ({ icon: 'library-books', label: 'פרטים נוספים', value: r.more_details }) },
  { row: (r) => ({ icon: 'link', label: 'כתובת אתר', value: r.url ? 'קישור למידע נוסף' : undefined, href: r.url }) },
  { row: (r) => ({ icon: 'person', label: 'שם מנהל.ת', value: r.manager_name }) },
  { row: (r) => ({ icon: 'perm-phone-msg', label: 'טלפון', value: r.phone, href: `tel:${r.phone}` }) },
  { row: (r) => ({ icon: 'email', label: 'דוא"ל', value: r.email, href: `mailto:${r.email}` }) },
];

export function detailRows(item: any): DetailRow[] {
  const resolved = item?.resolved;
  if (!resolved) {
    return [];
  }
  return FIELDS
    .filter((field) => !field.kinds || field.kinds.includes(resolved.facility_kind))
    .map((field) => field.row(resolved))
    .filter((row): row is DetailRow => !!row.value);
}
