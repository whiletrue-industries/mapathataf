import { HttpClient } from '@angular/common/http';
import { computed, Injectable, NgZone, signal } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { map, Observable, switchMap, tap } from 'rxjs';

export type DiscussResult = {
  complete: boolean;
  message: string;
};

function resolve(item: any, field: string): any {
  const tries = [item.user, item.admin, ...(item.official || [])];
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
    address: item.info.formatted_address || resolve(item, 'address'),
    license_status: resolve(item, 'license_status'),
    symbol: resolve(item, 'symbol'),
    source: resolve(item, 'source'),
    symbol_text: resolve(item, 'symbol_text'),
  };
  if (item.resolved.license_status === 'לא הוגשה בקשה לרישוי') {
    item.resolved.license_status_code = 'did_not_apply';
  } else if (item.resolved.license_status === 'רישיון בתוקף') {
    item.resolved.license_status_code = 'valid';
  } else if (item.resolved.license_status === 'בתהליך רישוי') {
    item.resolved.license_status_code = 'in_progress';
  } else if (!item.resolved.license_status) {
    item.resolved.license_status = 'לא ידוע';
    item.resolved.license_status_code = 'none';
  } else {
    console.log('UNEXPECTED LICENSE STATUS', item.resolved.license_status);
  }

  if (!item.resolved.symbol_text) {
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
  selectedId = signal<string | null>(null);
  selectedItem = computed(() => {
    const id = this.selectedId();
    const items = this.items();
    if (id) {
      return items.find((item) => item.info._id === id);
    }
    return null;
  });
  workspace = signal<any>({});
  mapPaddingBottom = signal<number>(0);

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
        data = data.filter((item) => {
          return item.info && item.info.lng && item.info.lat && item.info._id;
        });
        data.forEach((item) => {
          resolveItem(item);
        });
        this.items.set(data);
      })
    );
  }

  selectId(selectedId: any) {
    this.selectedId.update((value) => {
      if (value === selectedId) {
        return null;
      }
      return selectedId;
    });
  }

}
