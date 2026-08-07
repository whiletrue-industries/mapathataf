import { Injectable } from '@angular/core';
import dayjs from 'dayjs';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  // secrets and per-item derived values that have no place in an export
  SKIPPED_KEYS = ['key', 'symbol_text', 'office', 'facility_kind_editable'];

  async exportItems(items: any[]) {
    const XLSX = await import('xlsx');
    const rows = items.map((item) => this.flattenItem(item));
    const headers = this.collectHeaders(rows);
    const sheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    const workbook = XLSX.utils.book_new();
    workbook.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(workbook, sheet, 'מפת הטף');
    XLSX.writeFile(workbook, `מפת הטף_${dayjs().format('YYYY-MM-DD')}.xlsx`);
  }

  flattenItem(item: any): Record<string, any> {
    const row: Record<string, any> = { id: item.id };
    this.addSection(row, 'resolved', item.resolved);
    this.addSection(row, 'admin', item.admin);
    this.addSection(row, 'owner', item.user);
    this.addSection(row, 'info', item.info);
    const sourceCounts: Record<string, number> = {};
    for (const official of item.official || []) {
      const source = official.source || 'unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
      const count = sourceCounts[source];
      this.addSection(row, count > 1 ? `official_${source}${count}` : `official_${source}`, official);
    }
    return row;
  }

  // Excel cells are limited to 32767 characters
  MAX_CELL_LENGTH = 32000;

  addSection(row: Record<string, any>, prefix: string, data: any) {
    for (const [key, value] of Object.entries(data || {})) {
      if (this.SKIPPED_KEYS.includes(key) || value === undefined || value === null) {
        continue;
      }
      let cell: any = value;
      if (Array.isArray(value) && value.every((v) => typeof v !== 'object')) {
        cell = value.join(', ');
      } else if (typeof value === 'object') {
        cell = JSON.stringify(value);
      }
      if (typeof cell === 'string' && cell.length > this.MAX_CELL_LENGTH) {
        cell = cell.slice(0, this.MAX_CELL_LENGTH) + '…';
      }
      row[`${prefix}_${key}`] = cell;
    }
  }

  collectHeaders(rows: Record<string, any>[]): string[] {
    const headers: string[] = [];
    for (const row of rows) {
      for (const key of Object.keys(row)) {
        if (!headers.includes(key)) {
          headers.push(key);
        }
      }
    }
    const SECTION_ORDER = ['id', 'resolved', 'admin', 'owner', 'info'];
    const groupOf = (key: string) => key.match(/^(resolved|admin|owner|info|official_[^_]+)_/)?.[1] || key;
    const groups = [...new Set(headers.map(groupOf))];
    const groupRank = (key: string) => {
      const group = groupOf(key);
      const section = SECTION_ORDER.indexOf(group);
      return section !== -1 ? section : SECTION_ORDER.length + groups.indexOf(group);
    };
    // stable sort: order the section groups, keep first-seen order within each group
    return headers.sort((a, b) => groupRank(a) - groupRank(b));
  }
}
