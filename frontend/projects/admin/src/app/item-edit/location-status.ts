export function geocodeStatusText(item: any): string {
  const admin = item?.admin || {};
  if (admin.geocode_address) {
    if (admin._private_geocoded_input !== admin.geocode_address) {
      return 'ממתין לאיכון';
    }
    if (admin._private_geocoding_status === 'OK') {
      return `אוכן בהצלחה: ${admin.formatted_address}`;
    }
    return 'האיכון נכשל — נסו כתובת מדויקת יותר או קוד פלוס';
  }
  if (item?.info?.lat && item?.info?.lng) {
    return 'אוכן אוטומטית מהמקור הרשמי';
  }
  return 'ללא מיקום — לא יוצג במפה';
}

export function resolvedLocationText(item: any): string {
  const lat = Number(item?.resolved?.lat);
  const lng = Number(item?.resolved?.lng);
  return lat && lng ? `${lat.toFixed(5)}, ${lng.toFixed(5)}` : 'אין';
}
