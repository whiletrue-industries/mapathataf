import { geocodeStatusText, resolvedLocationText } from './location-status';

describe('geocodeStatusText', () => {

  it('reports success with the geocoded address when the geocode is current', () => {
    const text = geocodeStatusText({
      admin: {
        geocode_address: '849VCWC8+R9',
        _private_geocoded_input: '849VCWC8+R9',
        _private_geocoding_status: 'OK',
        formatted_address: 'אום אל-פחם',
      },
    });
    expect(text).toBe('אוכן בהצלחה: אום אל-פחם');
  });

  it('reports failure when the geocode ran on the current input and did not succeed', () => {
    const text = geocodeStatusText({
      admin: {
        geocode_address: 'שכונת אל-קסם',
        _private_geocoded_input: 'שכונת אל-קסם',
        _private_geocoding_status: 'ZERO_RESULTS',
      },
    });
    expect(text).toBe('האיכון נכשל — נסו כתובת מדויקת יותר או קוד פלוס');
  });

  it('reports pending when the input has not been geocoded yet', () => {
    const text = geocodeStatusText({
      admin: {
        geocode_address: 'כתובת חדשה',
        _private_geocoded_input: 'כתובת ישנה',
        _private_geocoding_status: 'OK',
      },
    });
    expect(text).toBe('ממתין לאיכון');
  });

  it('reports automatic geocoding when only the pipeline located the item', () => {
    const text = geocodeStatusText({
      admin: {},
      info: { lat: 31.9, lng: 34.8 },
    });
    expect(text).toBe('אוכן אוטומטית מהמקור הרשמי');
  });

  it('reports no location when nothing is available', () => {
    expect(geocodeStatusText({ admin: {}, info: {} })).toBe('ללא מיקום — לא יוצג במפה');
    expect(geocodeStatusText(null)).toBe('ללא מיקום — לא יוצג במפה');
  });
});

describe('resolvedLocationText', () => {

  it('formats resolved coordinates to five decimal places', () => {
    const text = resolvedLocationText({ resolved: { lat: 32.123456789, lng: 34.987654321 } });
    expect(text).toBe('32.12346, 34.98765');
  });

  it('handles numeric strings', () => {
    expect(resolvedLocationText({ resolved: { lat: '32.1', lng: '34.9' } })).toBe('32.10000, 34.90000');
  });

  it('reports none when coordinates are missing or invalid', () => {
    expect(resolvedLocationText({ resolved: {} })).toBe('אין');
    expect(resolvedLocationText({ resolved: { lat: 'abc', lng: 34.9 } })).toBe('אין');
    expect(resolvedLocationText(null)).toBe('אין');
  });
});
