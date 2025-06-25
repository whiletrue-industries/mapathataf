import { HttpClient } from '@angular/common/http';
import { computed, Injectable, NgZone, signal } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { map, Observable, switchMap, tap } from 'rxjs';

export type DiscussResult = {
  complete: boolean;
  message: string;
};

function resolve(item: any, field: string): any {
  const tries = [item.user, item.admin, item.info, ...(item.official || [])];
  for (const tryItem of tries) {
    if (tryItem && tryItem[field]) {
      return tryItem[field];
    }
  }
}

export function resolveItem(item: any): any {
  item.resolved = {
    name: resolve(item, 'name'),
    phone: resolve(item, 'phone'),
    url: resolve(item, 'url'),
    address: resolve(item, 'formatted_address') || resolve(item, 'address'),
    license_status: resolve(item, 'license_status'),
    licensing_not_needed: resolve(item, 'licensing_not_needed'),
    symbol: resolve(item, 'symbol'),
    source: resolve(item, 'source'),
    symbol_text: resolve(item, 'symbol_text'),
    lat: resolve(item, 'lat'),
    lng: resolve(item, 'lng'),
    facility_kind: resolve(item, 'facility_kind') || 'not-set',
    facility_sub_kind: resolve(item, 'facility_sub_kind'),
    facility_kind_editable: !item.info?.facility_kind,
    age_group: resolve(item, 'age_group'),
    mentoring_type: resolve(item, 'mentoring_type'),
    subsidized: item?.official?.some((o: any) => o.source === 'mol') || false,
    activity_hours: resolve(item, 'activity_hours'),
  };
  if (item.resolved.license_status === 'לא הוגשה בקשה לרישוי') {
    item.resolved.license_status_code = 'did_not_apply';
  } else if (item.resolved.license_status === 'רישיון בתוקף') {
    item.resolved.license_status_code = 'valid';
  } else if (item.resolved.license_status === 'בתהליך רישוי') {
    item.resolved.license_status_code = 'in_progress';
  } else if (!item.resolved.license_status) {
    if (item.resolved.licensing_not_needed) {
      item.resolved.license_status = 'מתחת ל-7 ילדים ואינו דורש רישוי';
      item.resolved.license_status_code = 'not_needed';
    } else {
      item.resolved.license_status = 'לא ידוע';
      item.resolved.license_status_code = 'none';
    }
  } else {
    console.log('UNEXPECTED LICENSE STATUS', item.resolved.license_status);
  }

  if (!item.resolved.symbol_text && item.resolved.symbol) {
    if (item.resolved.source === 'labor') {
      item.resolved.symbol_text = `${item.resolved.symbol} (משרד העבודה)`;
    } else if (item.resolved.source === 'welfare') {
      item.resolved.symbol_text = `${item.resolved.symbol} (משרד הרווחה)`;
    } else {
      item.resolved.symbol_text = `${item.resolved.symbol}`
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  BASE_URL = 'https://api-m5crpfzdeq-ez.a.run.app';

  items = signal<any[]>([]);
  workspace = signal<any>({});

  constructor(private http: HttpClient) { }

  fetchData(workspaceId: string): Observable<any[]> {
    const params = {
      page_size: 100000,
    };
    return this.http.get<any[]>(`${this.BASE_URL}/${workspaceId}`).pipe(
      switchMap((data) => {
        this.workspace.set(data);
        console.log('WORKSPACE:', data);
        return this.http.get<any[]>(`${this.BASE_URL}/${workspaceId}/items`, {params})
      }),
      tap((data) => {
        data.forEach((item) => {
          resolveItem(item);
        });
        data = data.filter((item) => {
          return item.info && item.resolved.lng && item.resolved.lat && item.info._id;
        });
        this.items.set(data);
      })
    );
  }
}
