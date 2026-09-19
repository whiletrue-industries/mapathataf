import { resolveItem } from '../api.service';
import { detailRows } from './detail-rows';

function labels(item: any): string[] {
  resolveItem(item);
  return detailRows(item).map((row) => row.label);
}

describe('item sheet detail rows', () => {
  const fullEducation = () => ({
    info: { facility_kind: 'education' },
    admin: {
      mentoring_type: 'municipal', display_address: 'הרצל 5, רחובות', age_group: ['1_to_2'],
      url: 'https://example.com', email: 'gan@example.com', owner_kind: 'private',
    },
    user: { activity_hours: '07:30-16:00', more_details: 'חצר גדולה' },
    official: [{
      source: 'mol', symbol: '123', license_status: 'רישיון בתוקף', school_year: 'תשפ״ז',
      manager_name: 'רות', phone: '08-1234567',
    }],
  });

  it('shows every field in the fixed order', () => {
    expect(labels(fullEducation())).toEqual([
      'רישוי (תשפ״ז)', 'סמל מעון', 'הדרכת צוות', 'כתובת', 'גיל', 'שעות פעילות', 'פרטים נוספים',
      'כתובת אתר', 'שם מנהל.ת', 'טלפון', 'דוא"ל',
    ]);
  });

  it('leaves out fields nobody entered a value for', () => {
    const item = { info: { facility_kind: 'education' }, admin: { display_address: 'הרצל 5' }, official: [] };
    expect(labels(item)).toEqual(['כתובת']);
  });

  it('does not show the "unknown" licensing and mentoring placeholders', () => {
    const item: any = { info: { facility_kind: 'education' }, admin: {}, official: [] };
    resolveItem(item);
    expect(item.resolved.license_status).toBe('לא ידוע');
    expect(item.resolved.mentoring_type).toBe('not-mentored');
    expect(detailRows(item)).toEqual([]);
  });

  it('shows licensing that follows from an entered value', () => {
    const item = { info: { facility_kind: 'education' }, admin: { licensing_not_needed: true }, official: [] };
    expect(labels(item)).toEqual(['רישוי']);
  });

  it('leaves education-only fields out of a health facility even when it has the values', () => {
    const item = {
      info: { facility_kind: 'health', facility_sub_kind: 'טיפת חלב', age_group: ['birth_to_1', '1_to_2', '2_to_3', '3_to_6'] },
      admin: { mentoring_type: 'municipal' },
      official: [{
        source: 'moh', symbol: '5120000395', license_status: 'רישיון בתוקף', address: 'אהרוני 21, רחובות',
        phone: '08-9466544', activity_hours: 'א-ג 08:00-15:45', more_details: 'לקביעת תור 5400*',
      }],
    };
    expect(labels(item)).toEqual(['כתובת', 'גיל', 'שעות פעילות', 'פרטים נוספים', 'טלפון']);
  });

  it('links the phone, email and website rows', () => {
    const item = fullEducation();
    resolveItem(item);
    const hrefs = Object.fromEntries(detailRows(item).filter((row) => row.href).map((row) => [row.label, row.href]));
    expect(hrefs).toEqual({
      'כתובת אתר': 'https://example.com', 'טלפון': 'tel:08-1234567', 'דוא"ל': 'mailto:gan@example.com',
    });
  });

  it('is empty without an item', () => {
    expect(detailRows(null)).toEqual([]);
  });
});
