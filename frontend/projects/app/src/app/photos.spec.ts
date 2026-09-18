import { itemPhotos, layerPhotos, MAX_PHOTOS, photosUpdate } from './photos';

describe('photos', () => {
  describe('layerPhotos', () => {
    it('reads the photos list', () => {
      expect(layerPhotos({ photos: ['a', 'b'] })).toEqual(['a', 'b']);
    });

    it('falls back to the legacy single photo', () => {
      expect(layerPhotos({ photo: 'a' })).toEqual(['a']);
    });

    it('prefers the list over a legacy photo, even when the list was emptied', () => {
      expect(layerPhotos({ photos: ['b'], photo: 'a' })).toEqual(['b']);
      expect(layerPhotos({ photos: [], photo: 'a' })).toEqual([]);
    });

    it('drops junk entries and anything past the maximum', () => {
      expect(layerPhotos({ photos: ['a', null, '', 7, 'b'] })).toEqual(['a', 'b']);
      const many = Array.from({ length: MAX_PHOTOS + 3 }, (_, i) => `p${i}`);
      expect(layerPhotos({ photos: many }).length).toBe(MAX_PHOTOS);
    });

    it('is empty for a missing layer or a nulled photo', () => {
      expect(layerPhotos(undefined)).toEqual([]);
      expect(layerPhotos({ photo: null })).toEqual([]);
    });
  });

  describe('itemPhotos', () => {
    it('lets the owner layer win over the admin layer', () => {
      expect(itemPhotos({ user: { photos: ['u'] }, admin: { photos: ['a'] } })).toEqual(['u']);
    });

    it('falls through to the admin layer when the owner has none', () => {
      expect(itemPhotos({ user: { photos: [] }, admin: { photos: ['a'] } })).toEqual(['a']);
      expect(itemPhotos({ admin: { photo: 'legacy' } })).toEqual(['legacy']);
    });

    it('is empty for an item with no photos, or no item', () => {
      expect(itemPhotos({ user: {}, admin: {} })).toEqual([]);
      expect(itemPhotos(null)).toEqual([]);
    });
  });

  describe('photosUpdate', () => {
    it('nulls the legacy photo so it is not stored twice', () => {
      expect(photosUpdate({ photo: 'a' }, ['a', 'b'])).toEqual({ photos: ['a', 'b'], photo: null });
    });

    it('leaves the legacy key alone when there is none', () => {
      expect(photosUpdate({}, ['a'])).toEqual({ photos: ['a'] });
    });

    it('never stores more than the maximum', () => {
      const many = Array.from({ length: MAX_PHOTOS + 2 }, (_, i) => `p${i}`);
      expect(photosUpdate({}, many)['photos'].length).toBe(MAX_PHOTOS);
    });
  });
});
