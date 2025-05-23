import { HttpClient } from '@angular/common/http';
import { computed, Injectable, NgZone, signal } from '@angular/core';
import { ActivatedRoute, ActivatedRouteSnapshot } from '@angular/router';
import { map, Observable, switchMap, tap } from 'rxjs';

export type DiscussResult = {
  complete: boolean;
  message: string;
};


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

  resolve(item: any, field: string): any {
    const tries = [item.user, item.admin, ...(item.official || [])];
    for (const tryItem of tries) {
      if (tryItem && tryItem[field]) {
        return tryItem[field];
      }
    }
  }

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
          item.resolved = {
            name: this.resolve(item, 'name'),
            phone: this.resolve(item, 'phone'),
            address: item.info.formatted_address || this.resolve(item, 'address'),
          };
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
