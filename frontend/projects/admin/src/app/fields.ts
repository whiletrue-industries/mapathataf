export type Option = {
  id: string;
  display: string;
}

export type Field = {
  name: string;
  type?: 'text' | 'boolean' | 'enum' | 'multi-enum' | 'section' | 'image' | 'readonly';
  label?: string;
  options?: Option[];
  hide?: boolean;
  value?: any;
  internal?: boolean;
};

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
      } else {
        return data[field.name] || null;
      }
    }
    return null;
  }
