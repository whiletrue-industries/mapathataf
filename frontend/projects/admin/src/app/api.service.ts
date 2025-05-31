import { HttpClient } from '@angular/common/http';
import { effect, Injectable, signal } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  
  BASE_URL = 'https://api-m5crpfzdeq-ez.a.run.app';

  workspace = signal<any>({});
  workspaceId = signal<string | null>(null);
  itemId = signal<string | null>(null);
  apiKey = signal<string | null>(null);
  itemKey = signal<string | null>(null);
  items = signal<any[]>([]);
  item = signal<any | null>(null);

  constructor(private http: HttpClient) { }

  updateFromRoute(route: ActivatedRouteSnapshot) {
    const workspaceId = route.params['workspaceId'];
    const itemId = route.params['itemId'];
    const apiKey = route.queryParams['key'];
    const itemKey = route.queryParams['item-key'];
    this.workspaceId.set(workspaceId);
    this.apiKey.set(apiKey || null);
    this.itemKey.set(itemKey || null);
    this.itemId.set(itemId || null);
    console.log('Updating from route:', workspaceId, itemId, apiKey, itemKey);
    effect(() => {
      const id = this.workspaceId();
      const key = this.apiKey();
      if (id && key) {
        console.log('Fetching data for workspaceId:', id);
        this.fetchData(id).subscribe();
      }
    });
    effect(() => {
      const id = this.workspaceId();
      const itemId = this.itemId();
      console.log('Fetching item for id:', id, 'and itemId:', itemId);
      if (id && itemId) {
        this.fetchItem(id, itemId).subscribe((item) => {
          if (item) {
            this.item.set(item);
          } else {
            this.item.set(null);
          }
        });
      }
    });
  }

  resolve(item: any, field: string): any {
    const tries = [item.user, item.admin, ...(item.official || [])];
    for (const tryItem of tries) {
      if (tryItem && tryItem[field]) {
        return tryItem[field];
      }
    }
  }

  fetchData(workspaceId: string) {
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
        data = data.sort((a, b) => a.info._id.localeCompare(b.info._id)); 
        data.forEach((item) => {
          item.official = item.official || [];
          item.official = item.official.sort((a: any, b: any) => a.source.localeCompare(b.source));
          item.resolved = {
            name: this.resolve(item, 'name'),
            phone: this.resolve(item, 'phone'),
            address: item.info.formatted_address || this.resolve(item, 'address'),
            license_status: this.resolve(item, 'license_status'),
            symbol: this.resolve(item, 'symbol'),
            source: this.resolve(item, 'source'),
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

          if (item.resolved.source) {
            if (item.resolved.source === 'labor') {
              item.resolved.symbol_text = `${item.resolved.symbol} (משרד העבודה)`;
            } else if (item.resolved.source === 'welfare') {
              item.resolved.symbol_text = `${item.resolved.symbol} (משרד הרווחה)`;
            } else {
              item.resolved.symbol_text = `${item.resolved.symbol}`
            }            
          }
        });
        this.items.set(data);
      })
    );
  }

  fetchItem(workspaceId: string, itemId: string) {
    return this.http.get<any[]>(`${this.BASE_URL}/${workspaceId}/${itemId}`).pipe(
      map((item: any) => {
        item.admin = item.admin || {};
        if (item.admin.app_publication === undefined) {
          item.admin.app_publication = true; // Default to true if not set
        }
        item.official = item.official || [];
        item.official.forEach((official: any) => {
          const source = official.source || 'unknown';
          if (source === 'mol') {
            official.office = 'משרד העבודה';
          } else if (source === 'welfare') {
            official.office = 'משרד הרווחה';
          } else if (source === 'moe') {
            official.office = 'משרד החינוך';
          }
          official.symbol_text = `${official.symbol} (${official.office})`;
        });
        return item || null;
      })
    );
  }

  updateItem(update: any) {
    const workspaceId = this.workspaceId();
    const itemId = this.itemId();
    const apiKey = this.apiKey();
    const itemKey = this.itemKey();
    if (!workspaceId || !itemId) {
      console.error('Cannot update item: workspaceId or itemId is not set');
      return;
    }
    if (!update || Object.keys(update).length === 0) {
      console.warn('No update data provided');
      return;
    }
    const options: any = {}
    if (apiKey) {
      options.headers = {
        'Authorization': `${apiKey}`
      };
    }
    if (itemKey) {
      options.params = {
        'item-key': itemKey
      };
    }
    console.log('Updating item:', workspaceId, itemId, update);
    this.http.put<any>(`${this.BASE_URL}/${workspaceId}/${itemId}`, update, options).subscribe((response) => {
      console.log('Item updated successfully:', response);
      this.fetchItem(workspaceId, itemId).subscribe((item) => {
        if (item) {
          this.item.set(item);
        } else {
          this.item.set(null);
        }
      });
    });
  }
}
