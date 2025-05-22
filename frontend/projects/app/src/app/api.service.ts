import { HttpClient } from '@angular/common/http';
import { Injectable, NgZone, signal } from '@angular/core';
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

  CHRONOMAPS_API_URL = 'https://chronomaps-api-qjzuw7ypfq-ez.a.run.app';
  SCREENSHOT_HANDLER_URL = 'https://screenshot-handler-qjzuw7ypfq-ez.a.run.app';
  ITEM_INGRES_AGENT_URL = 'https://item-ingress-agent-qjzuw7ypfq-ez.a.run.app';

  // WORKSPACE = '4d2c04b0-51b7-4aa2-a234-0e4be53447de';
  // API_KEY = 'f290c30a-8819-42a0-aa0b-77f5582b4a2f';

  item = signal<any>(null);
  api_key = signal<string>('a356977d-219f-4d65-ae18-d8e98280bca1');
  workspace = signal<string>('03da8ede-395b-4fd2-b46e-bc2bc7f4035c');
  automatic = signal<boolean>(false);

  constructor(private http: HttpClient, private zone: NgZone) { }

  updateFromRoute(route: ActivatedRouteSnapshot) {
    const workspace = route.queryParams['workspace'] || this.workspace();
    const api_key = route.queryParams['api_key'] || this.api_key();
    const automatic = route.queryParams['automatic'] || this.automatic();
    if (automatic) {
      this.automatic.set(automatic === 'true');
    }
    if (workspace) {
      this.workspace.set(workspace);
    }
    if (api_key) {
      this.api_key.set(api_key);
    }
  }

  fetchItem(item_id: string, item_key: string): Observable<any> { 
    const params = {
      item_key: item_key,
    };
    const headers = {
      'Authorization': this.api_key(),
    };
    return this.http.get(`${this.CHRONOMAPS_API_URL}/${this.workspace()}/${item_id}`, {params, headers}).pipe(
      map((response: any) => {
        response.item_id = item_id;
        response.item_key = item_key;
        this.item.set(response);
        return response;
      })
    );
  }

  startDiscussion(image: Blob): Observable<any> {
    const formData = new FormData();
    formData.append('image', image);
    const params: any = {
      workspace: this.workspace(),
      api_key: this.api_key(),
    };
    if (this.automatic()) {
      params['automatic'] = 'true';
    }
    return this.http.post(this.SCREENSHOT_HANDLER_URL, formData, { params });
  }

  sendInitMessageNoStream(item_id: string, item_key: string): Observable<any> {
    const params = {
      workspace: this.workspace(),
      api_key: this.api_key(),
      item_id,
      item_key,
      message: 'initial',
      stream: 'false',
    };
    return this.http.get(`${this.ITEM_INGRES_AGENT_URL}`, {params}).pipe(
      map((response: any) => {
        return response.status;
      })
    );
  }

  sendMessage(message: string): Observable<any> {
    const params = {
      workspace: this.workspace(),
      api_key: this.api_key(),
      item_id: this.item().item_id,
      item_key: this.item().item_key,
      message: message,
    };
    // return this.http.get(`${this.ITEM_INGRES_AGENT_URL}`, {params}).pipe(
    //   map((response: any) => {
    //     return response as DiscussResult;
    //   })
    // );
    return new Observable(observer => {
      const url = `${this.ITEM_INGRES_AGENT_URL}?${new URLSearchParams(params).toString()}`;
      const eventSource = new EventSource(url);
      eventSource.onmessage = (event) => {
        // console.log('EVENT', event);
        try {
          this.zone.run(() => {
            observer.next(JSON.parse(event.data));
          });
        } catch (error) {
          console.error('PARSE ERROR', error);
          observer.error(error);
        }
      };
      eventSource.onerror = (error) => {
        console.error('EVENTSOURCE ERROR', error);
        eventSource.close(); //
        observer.complete();
        // observer.error(error);
      };
      return () => {
        eventSource.close();
      };
    });    
  }
}
