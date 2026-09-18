export const MAX_PHOTOS = 5;

// Photos are data-URIs stored inside the item's Firestore document, which is capped at
// 1 MiB. Two layers (owner + municipality) of MAX_PHOTOS each have to fit under that
// together with everything else in the document, hence the per-photo budget.
export const MAX_PHOTO_CHARS = 90_000;

// A layer holds either the current `photos` list or the legacy single `photo`.
export function layerPhotos(layer: any): string[] {
  if (!layer) {
    return [];
  }
  const photos = Array.isArray(layer.photos) ? layer.photos : (layer.photo ? [layer.photo] : []);
  return photos.filter((photo: any) => typeof photo === 'string' && photo).slice(0, MAX_PHOTOS);
}

// The update that stores `photos` on a layer. A legacy `photo` is nulled in the same
// write so the document does not keep carrying that image twice.
export function photosUpdate(layer: any, photos: string[]): Record<string, any> {
  const update: Record<string, any> = { photos: photos.slice(0, MAX_PHOTOS) };
  if (layer?.photo) {
    update['photo'] = null;
  }
  return update;
}

// Same precedence as every other field: the owner's photos win over the municipality's.
export function itemPhotos(item: any): string[] {
  for (const layer of [item?.user, item?.admin]) {
    const photos = layerPhotos(layer);
    if (photos.length) {
      return photos;
    }
  }
  return [];
}
