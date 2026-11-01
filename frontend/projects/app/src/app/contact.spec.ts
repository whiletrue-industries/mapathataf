import { contactHref, emailHref, phoneHref, webHref } from './contact';

describe('contact links', () => {
  it('accepts web addresses and adds a scheme to a bare domain', () => {
    expect(webHref('https://www.example.co.il/page?a=1')).toBe('https://www.example.co.il/page?a=1');
    expect(webHref(' http://example.org ')).toBe('http://example.org');
    expect(webHref('WWW.MLT.CO.IL')).toBe('https://WWW.MLT.CO.IL');
    expect(webHref('example.org/about')).toBe('https://example.org/about');
  });

  it('rejects what owners and admins put in the website field instead', () => {
    for (const value of ['0528747043', 'gilrach@rehovot.muni.il', 'ההגנה 66 רחובות', 'פרטים דרך איזי',
      'הגן האוהב', 'https://', 'https://localhost', '', null, undefined, 42]) {
      expect(webHref(value)).withContext(String(value)).toBeNull();
    }
  });

  it('accepts one Israeli phone number in any common spelling', () => {
    expect(phoneHref('050-5145929')).toBe('tel:0505145929');
    expect(phoneHref(' 08-6386569')).toBe('tel:086386569');
    expect(phoneHref('050-214-4919')).toBe('tel:0502144919');
    expect(phoneHref('(08) 939 2154')).toBe('tel:089392154');
    expect(phoneHref('+972-50-5145929')).toBe('tel:0505145929');
    expect(phoneHref('073-3958711')).toBe('tel:0733958711');
    expect(phoneHref('1-800-123-456')).toBe('tel:1800123456');
    expect(phoneHref('*5400')).toBe('tel:*5400');
  });

  it('rejects annotated, doubled, short or garbled phone numbers', () => {
    for (const value of ['050-5145929 (וואטסאפ)', '0544482298/ 0525525449', '504557924', '055270192',
      '05276569990', ' 640-5493 -052', '00', 'מעון 89468941 . נייד מנהלת -  0525296496', '', null]) {
      expect(phoneHref(value)).withContext(String(value)).toBeNull();
    }
  });

  it('accepts email addresses only', () => {
    expect(emailHref(' info@haplatforma.org.il ')).toBe('mailto:info@haplatforma.org.il');
    expect(emailHref('M58@neot-m.co.il')).toBe('mailto:M58@neot-m.co.il');
    for (const value of ['gilrach@rehovot', 'two words@example.com', 'https://example.com', '', null]) {
      expect(emailHref(value)).withContext(String(value)).toBeNull();
    }
  });

  it('dispatches by kind', () => {
    expect(contactHref('url', 'example.org')).toBe('https://example.org');
    expect(contactHref('phone', '08-9392154')).toBe('tel:089392154');
    expect(contactHref('email', 'a@b.co')).toBe('mailto:a@b.co');
  });
});
