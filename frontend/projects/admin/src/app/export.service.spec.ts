import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  describe('flattenItem', () => {
    it('prefixes each section, mapping the user section to owner_', () => {
      const row = service.flattenItem({
        id: 'abc',
        resolved: { name: 'גן חלומותיי' },
        admin: { address: 'הרצל 1' },
        user: { address: 'הרצל 2', phone: '03-1234567' },
        info: { city: 'רחובות' },
      });
      expect(row).toEqual({
        id: 'abc',
        resolved_name: 'גן חלומותיי',
        admin_address: 'הרצל 1',
        owner_address: 'הרצל 2',
        owner_phone: '03-1234567',
        info_city: 'רחובות',
      });
    });

    it('prefixes official records by source and numbers repeated sources', () => {
      const row = service.flattenItem({
        id: 'abc',
        official: [
          { source: 'moe', symbol: '111', name: 'א' },
          { source: 'moe', symbol: '222', name: 'ב' },
          { source: 'mol', symbol: '333', name: 'ג' },
        ],
      });
      expect(row['official_moe_symbol']).toBe('111');
      expect(row['official_moe2_symbol']).toBe('222');
      expect(row['official_mol_symbol']).toBe('333');
      expect(row['official_moe_source']).toBe('moe');
    });

    it('handles items with missing sections', () => {
      expect(service.flattenItem({ id: 'abc' })).toEqual({ id: 'abc' });
    });
  });

  describe('addSection', () => {
    it('skips secrets, derived fields and empty values', () => {
      const row: Record<string, any> = {};
      service.addSection(row, 'owner', {
        key: 'secret-item-key',
        symbol_text: '111 (משרד החינוך)',
        office: 'משרד החינוך',
        facility_kind_editable: true,
        name: undefined,
        phone: null,
        email: 'a@b.c',
      });
      expect(row).toEqual({ owner_email: 'a@b.c' });
    });

    it('keeps booleans and numbers as-is', () => {
      const row: Record<string, any> = {};
      service.addSection(row, 'admin', { app_publication: false, lat: 31.89 });
      expect(row['admin_app_publication']).toBe(false);
      expect(row['admin_lat']).toBe(31.89);
    });

    it('joins primitive arrays and stringifies objects', () => {
      const row: Record<string, any> = {};
      service.addSection(row, 'resolved', {
        age_group: ['birth_to_1', '1_to_2'],
        nested: { a: 1 },
      });
      expect(row['resolved_age_group']).toBe('birth_to_1, 1_to_2');
      expect(row['resolved_nested']).toBe('{"a":1}');
    });

    it('truncates values beyond the Excel cell limit', () => {
      const row: Record<string, any> = {};
      service.addSection(row, 'owner', { photo: 'x'.repeat(50000) });
      expect(row['owner_photo'].length).toBe(service.MAX_CELL_LENGTH + 1);
      expect(row['owner_photo'].endsWith('…')).toBeTrue();
    });
  });

  describe('collectHeaders', () => {
    it('orders columns id first, then by section', () => {
      const headers = service.collectHeaders([
        { official_moe_name: 'א', admin_address: 'ב', id: '1', owner_phone: 'ג', resolved_name: 'ד', info_city: 'ה' },
      ]);
      expect(headers).toEqual([
        'id', 'resolved_name', 'admin_address', 'owner_phone', 'info_city', 'official_moe_name',
      ]);
    });

    it('keeps a section contiguous when later rows add new keys to earlier sections', () => {
      const headers = service.collectHeaders([
        { id: '1', official_moe_name: 'א', official_mol_name: 'ב' },
        { id: '2', official_moe_name: 'ג', official_moe_capacity: 7 },
      ]);
      expect(headers).toEqual([
        'id', 'official_moe_name', 'official_moe_capacity', 'official_mol_name',
      ]);
    });

    it('unions keys across rows in first-seen order within a section', () => {
      const headers = service.collectHeaders([
        { id: '1', admin_name: 'א' },
        { id: '2', admin_address: 'ב', admin_name: 'ג' },
      ]);
      expect(headers).toEqual(['id', 'admin_name', 'admin_address']);
    });

    it('distinguishes numbered official sources as separate groups', () => {
      const headers = service.collectHeaders([
        { id: '1', official_moe_name: 'א', official_moe2_name: 'ב' },
        { id: '2', official_moe_symbol: '111' },
      ]);
      expect(headers).toEqual([
        'id', 'official_moe_name', 'official_moe_symbol', 'official_moe2_name',
      ]);
    });
  });
});
