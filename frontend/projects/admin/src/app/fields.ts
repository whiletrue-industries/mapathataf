import { layerPhotos } from '../../../app/src/app/photos';
import { ContactKind, contactHref } from '../../../app/src/app/contact';

export type Option = {
  id: string;
  display: string;
}

export type Field = {
  name: string;
  type?: 'text' | 'boolean' | 'enum' | 'multi-enum' | 'section' | 'images' | 'readonly';
  label?: string;
  options?: Option[];
  hide?: boolean;
  value?: any;
  internal?: boolean;
  /** A contact field: an entered value the map app cannot link to gets a warning. */
  validate?: ContactKind;
};

const CONTACT_WARNINGS: Record<ContactKind, string> = {
  url: 'כתובת אתר לא תקינה, לא תוצג במפה',
  phone: 'מספר טלפון לא תקין, לא יוצג במפה',
  email: 'כתובת דוא"ל לא תקינה, לא תוצג במפה',
};

/** The warning for a contact field's value, or null when it is empty or valid. */
export function contactWarning(field: Field | undefined, value: any): string | null {
  if (!field?.validate || value === null || value === undefined || String(value).trim() === '') {
    return null;
  }
  return contactHref(field.validate, value) ? null : CONTACT_WARNINGS[field.validate];
}

export function fieldValue(data: any, field: Field): any {
    if (data && field) {
      if (field.type === 'boolean') {
        return data[field.name] === true ? 'כן' : (data[field.name] === false ? 'לא' : null);
      } else if (field.type === 'enum' && field.options) {
        const option = field.options.find((opt: Option) => opt.id === data[field.name]);
        return option ? option.display : 'לא הוזן';
      } else if (field.type === 'multi-enum' && field.options) {
        const values: string[] = Array.isArray(data[field.name]) ? data[field.name] : [];
        const displays = field.options.filter((opt: Option) => values.includes(opt.id)).map((opt: Option) => opt.display);
        return displays.length ? displays.join(', ') : 'לא הוזן';
      } else if (field.type === 'images') {
        const photos = layerPhotos(data);
        return photos.length ? photos : null;
      } else {
        return data[field.name] || null;
      }
    }
    return null;
  }
