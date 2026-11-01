// Contact fields (website, phone, email) are free text wherever they come from - owners,
// admins and the official sources all put phone numbers in the website field, addresses in
// it, two numbers in one phone field. These turn a value into the link it stands for, or
// null when it is not one; a value without a link is not shown in the map app, and the
// admin editor warns about it (`admin/src/app/fields.ts`).

export type ContactKind = 'url' | 'phone' | 'email';
export const CONTACT_KINDS: ContactKind[] = ['url', 'phone', 'email'];

// A bare domain, optionally with a path: www.example.co.il, example.org/page
const BARE_DOMAIN = /^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}(\/\S*)?$/i;

export function webHref(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || /\s/.test(text)) {
    return null;
  }
  // Without a scheme the browser would resolve it as a path inside the app
  const candidate = /^https?:\/\//i.test(text) ? text : BARE_DOMAIN.test(text) ? `https://${text}` : null;
  if (!candidate) {
    return null;
  }
  try {
    return new URL(candidate).hostname.includes('.') ? candidate : null;
  } catch {
    return null;
  }
}

// Israeli numbers, by their digits once the separators are gone
const PHONE_PATTERNS = [
  /^0(5\d|7\d)\d{7}$/,     // mobile and VoIP: 050-1234567, 073-1234567
  /^0[23489]\d{7}$/,       // landline: 08-9123456
  /^1(599|700|800)\d{6}$/, // 1-800-123-456
  /^\*\d{4}$/,             // *5400
];

/** One number per field: an annotation ("(וואטסאפ)") or a second number makes it invalid. */
export function phoneHref(value: unknown): string | null {
  const text = typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  if (!/^[+*]?[\d\s\-.()]+$/.test(text)) {
    return null;
  }
  let digits = (text.startsWith('*') ? '*' : '') + text.replace(/\D/g, '');
  if (digits.startsWith('972')) {
    digits = '0' + digits.slice(3);
  }
  return PHONE_PATTERNS.some((pattern) => pattern.test(digits)) ? `tel:${digits}` : null;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@.]{2,}$/;

export function emailHref(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : '';
  return EMAIL.test(text) ? `mailto:${text}` : null;
}

export function contactHref(kind: ContactKind, value: unknown): string | null {
  switch (kind) {
    case 'url': return webHref(value);
    case 'phone': return phoneHref(value);
    case 'email': return emailHref(value);
  }
}
