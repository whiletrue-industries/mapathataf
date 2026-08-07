import { resolveItem } from './api.service';

describe('resolveItem location resolution', () => {

  it('resolves display_address as the displayed address when set', () => {
    const item: any = {
      admin: { display_address: 'ליד בניין העירייה', formatted_address: 'רחוב לא שימושי 1' },
      info: { formatted_address: 'רחוב אחר 2' },
    };
    resolveItem(item);
    expect(item.resolved.address).toBe('ליד בניין העירייה');
  });

  it('falls back to formatted_address, preferring admin over info', () => {
    const item: any = {
      admin: { formatted_address: 'ויצמן 100, תל אביב' },
      info: { formatted_address: 'כתובת ישנה' },
    };
    resolveItem(item);
    expect(item.resolved.address).toBe('ויצמן 100, תל אביב');
  });

  it('falls back to info formatted_address when admin has none', () => {
    const item: any = {
      admin: {},
      info: { formatted_address: 'הרצל 5, רחובות' },
    };
    resolveItem(item);
    expect(item.resolved.address).toBe('הרצל 5, רחובות');
  });

  it('falls back to raw official address when nothing was geocoded', () => {
    const item: any = {
      official: [{ address: 'שכונת אל-קסם', city: 'אום אל-פחם' }],
    };
    resolveItem(item);
    expect(item.resolved.address).toBe('שכונת אל-קסם');
  });

  it('resolves coordinates with admin taking precedence over info', () => {
    const item: any = {
      admin: { lat: 32.1, lng: 34.9 },
      info: { lat: 31.9, lng: 34.8 },
    };
    resolveItem(item);
    expect(item.resolved.lat).toBe(32.1);
    expect(item.resolved.lng).toBe(34.9);
  });

  it('resolves info coordinates when admin has none', () => {
    const item: any = {
      admin: { geocode_address: 'לא אוכן' },
      info: { lat: 31.9, lng: 34.8 },
    };
    resolveItem(item);
    expect(item.resolved.lat).toBe(31.9);
    expect(item.resolved.lng).toBe(34.8);
  });

  it('leaves coordinates undefined when no layer has them', () => {
    const item: any = { admin: {}, info: {} };
    resolveItem(item);
    expect(item.resolved.lat).toBeUndefined();
    expect(item.resolved.lng).toBeUndefined();
  });

  it('derives original_address from the first official record, appending the city', () => {
    const item: any = {
      official: [
        { source: 'moe' },
        { address: 'הרצל 5', city: 'רחובות' },
      ],
    };
    resolveItem(item);
    expect(item.resolved.original_address).toBe('הרצל 5, רחובות');
  });

  it('does not repeat the city when the official address already contains it', () => {
    const item: any = {
      official: [{ address: 'הרצל 5, רחובות', city: 'רחובות' }],
    };
    resolveItem(item);
    expect(item.resolved.original_address).toBe('הרצל 5, רחובות');
  });

  it('leaves original_address undefined without official records', () => {
    const item: any = { admin: { display_address: 'איפשהו' } };
    resolveItem(item);
    expect(item.resolved.original_address).toBeUndefined();
  });

  it('exposes display_address and formatted_address separately on resolved', () => {
    const item: any = {
      admin: { display_address: 'ליד המרכז' },
      info: { formatted_address: 'רחוב 1, עיר' },
    };
    resolveItem(item);
    expect(item.resolved.display_address).toBe('ליד המרכז');
    expect(item.resolved.formatted_address).toBe('רחוב 1, עיר');
    expect(item.resolved.address).toBe('ליד המרכז');
  });
});
