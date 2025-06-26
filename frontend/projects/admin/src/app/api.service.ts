import { HttpClient } from '@angular/common/http';
import { computed, effect, Injectable, signal } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { map, switchMap, tap } from 'rxjs';
import { resolveItem } from '../../../app/src/app/api.service';

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
  privilege = signal<number>(0);
  mode = computed(() => {
    const apiKey = this.apiKey();
    const itemKey = this.itemKey();
    const privilege = this.privilege();
    // console.log('Mode computed:', { apiKey, itemKey, privilege });
    if (apiKey && privilege === 4) {
      console.log('Mode: admin');
      return 'admin';
    }
    if (itemKey && privilege === 3) {
      console.log('Mode: user');
      return 'user';
    }
    return null;
  });

  neighborhoodOptions = computed(() => {
    const workspace = this.workspace();
    // console.log('Neighborhood options computed:', workspace.neighborhoods);
    const neighborhoods = workspace?.neighborhoods || [];
    return neighborhoods.map((n: any) => ({ id: n, display: n }));
  });

  cityName = computed(() => {
    const workspace = this.workspace();
    return workspace?.city || '';
  });

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
    // console.log('Updating from route:', workspaceId, itemId, apiKey, itemKey);
    effect(() => {
      const id = this.workspaceId();
      const key = this.apiKey();
      if (id) {
        // console.log('Fetching data for workspaceId:', id);
        this.fetchData(id).subscribe();
      }
    });
    effect(() => {
      const id = this.workspaceId();
      const itemId = this.itemId();
      // console.log('Fetching item for id:', id, 'and itemId:', itemId);
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

  prepare(item: any): any {
    item.official = item.official || [];
    item.official = item.official.sort((a: any, b: any) => a.source.localeCompare(b.source));
    item.admin = item.admin || {};
    item.user = item.user || {};
    if (item.admin.app_publication === undefined) {
      item.admin.app_publication = true; // Default to true if not set
    }
    item.official.forEach((official: any) => {
      const source = official.source || 'unknown';
      if (source === 'mol') {
        official.office = 'משרד העבודה';
      } else if (source === 'welfare') {
        official.office = 'משרד הרווחה';
      } else if (source === 'moe') {
        official.office = 'משרד החינוך';
      }
      if (official.symbol && official.office) {
        official.symbol_text = `${official.symbol} (${official.office})`;
      }
    });
    resolveItem(item);
  }

  fetchData(workspaceId: string) {
    const params = {
      page_size: 100000,
    };
    const headers: any = {};
    if (this.apiKey()) {
      headers['Authorization'] = this.apiKey();
    }
    return this.http.get<any[]>(`${this.BASE_URL}/${workspaceId}`, {headers}).pipe(
      switchMap((data: any) => {
        this.workspace.set(data);
        this.privilege.set(data._p);
        // console.log('WORKSPACE:', data);
        return this.http.get<any[]>(`${this.BASE_URL}/${workspaceId}/items`, {params, headers});
      }),
      tap((data) => {
        data = data.sort((a, b) => a.id?.localeCompare(b.id)); 
        data.forEach((item) => {
          this.prepare(item);
        });
        this.items.set(data);
      })
    );
  }

  reqOptions() {
    const apiKey = this.apiKey();
    const itemKey = this.itemKey();
    const options: any = {};
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
    return options;
  }

  fetchItem(workspaceId: string, itemId: string) {
    const options = this.reqOptions();
    return this.http.get<any[]>(`${this.BASE_URL}/${workspaceId}/${itemId}`, options).pipe(
      map((item: any) => {
        if (item) {
          this.privilege.set(item._p || 0);
          this.prepare(item);
          this.items.update((items) => {
            const index = items.findIndex(i => i.info._id === item.info._id);
            if (index !== -1) {
              items[index] = item; // Update existing item
            }
            return items;
          });
        }
        console.log('ITEM:', item);
        return item || null;
      })
    );
  }

  updateItem(update: any) {
    const workspaceId = this.workspaceId();
    const itemId = this.itemId();
    if (!workspaceId || !itemId) {
      console.error('Cannot update item: workspaceId or itemId is not set');
      return;
    }
    if (!update || Object.keys(update).length === 0) {
      console.warn('No update data provided');
      return;
    }
    const options = this.reqOptions();
    // console.log('Updating item:', workspaceId, itemId, update);
    this.http.put<any>(`${this.BASE_URL}/${workspaceId}/${itemId}`, update, options).subscribe((response) => {
      console.log('Item updated successfully:', response);
      this.fetchItem(workspaceId, itemId).subscribe((item) => {
        if (item) {
          console.log('setting item after update:', item);
          this.item.set(item);
        } else {
          this.item.set(null);
        }
      });
    });
  }

  newItem() {
    const workspaceId = this.workspaceId();
    const apiKey = this.apiKey();
    if (!workspaceId || !apiKey) {
      console.error('Cannot create new item: workspaceId or apiKey is not set');
      return;
    }
    const options = this.reqOptions();
    return this.http.post<any>(`${this.BASE_URL}/${workspaceId}`, {}, options).pipe(
      tap((item) => {
        this.prepare(item);
        console.log('New item created:', item);
        this.items.update((items) => [...items, item]);
        return item;
      })
    );
  }
}
