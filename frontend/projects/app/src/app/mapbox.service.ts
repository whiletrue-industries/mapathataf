import { Injectable } from '@angular/core';
import mapboxgl, { Map } from "mapbox-gl";
import { PlatformService } from './platform.service';
import { map, Observable, ReplaySubject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ApiService } from './api.service';
import { count } from 'console';
import { ResultItem } from './state.service'; // Assuming ResultItem is defined in state.service.ts

@Injectable({
  providedIn: 'root'
})
export class MapboxService {

  STYLE = 'mapbox://styles/treebase/cmazg83bc00as01qx6wwhak14/draft';
  ACCESS_TOKEN = 'pk.eyJ1IjoidHJlZWJhc2UiLCJhIjoiY2xjazVueWFnMHBscDN2bXRkdjh1dHd1cyJ9.zcn36ZZJ9b0RJlYJTSZYOA';

  init = new ReplaySubject<boolean>(1);
  session_uuid: string|null = null;
  map: Map | null = null;

  constructor(private platform: PlatformService, private http: HttpClient, private api: ApiService) {
    console.log('MAPBOX SERVICE CONSTRUCTOR');
    (mapboxgl as any).accessToken = this.ACCESS_TOKEN;
    this.platform.browser(() => {
      mapboxgl.setRTLTextPlugin(
        '/mapbox-gl-rtl-text.js',
        (error: any) => {
          if (error) {
            console.log('FAILED TO LOAD RTL PLUGIN', error);
          } else {
            console.log('RTL PLUGIN LOADED');
          }
          console.log('MAPBOX SERVICE INIT');
        },
        true // Lazy load the plugin
      );
      this.init.next(true);
    });
    this.platform.server(() => {
      console.log('SERVER MAPBOX SERVICE CONSTRUCTOR');
      this.init.next(true);
    });
  } 

  autocomplete(query: string): Observable<ResultItem[]> {
    const URL = 'https://api.mapbox.com/search/searchbox/v1/suggest';
    if (this.session_uuid === null) {
      this.session_uuid = crypto.randomUUID();
    }
    const params: any = {
      q: query,
      access_token: this.ACCESS_TOKEN,
      session_token: this.session_uuid,
      language: 'he',
      country: 'IL',
      types: 'address,poi,street',
      limit: 5,
    };
    const workspace = this.api.workspace();
    const bbox: number[] = workspace.bounds;
    if (bbox && bbox.length === 4) {
      params['bbox'] = bbox.map(coord => coord.toFixed(6)).join(',');
    }
    return this.http.get<any>(URL, {params}).pipe(
      map(response => response.suggestions || []),
      map(suggestions => suggestions.map((suggestion: any) => {
        const street = suggestion?.context?.street;
        if (!street) {
          return null;
        }
        return {
          id: street.id,
          name: street.name,
          kind: 'street'
        };
      }).filter((suggestion: any) => !!suggestion))
    );
  }

  autocompleteRetrieve(id: string) {
    const URL = 'https://api.mapbox.com/search/searchbox/v1/retrieve/' + id;
    const params: any = {
      access_token: this.ACCESS_TOKEN,
      session_token: this.session_uuid,
    };
    this.session_uuid = null;
    this.http.get<any>(URL, {params}).pipe(
      map(response => response.features[0].geometry.coordinates)
    ).subscribe((coordinates) => {
      this.map?.flyTo({
        center: coordinates,
        zoom: 17,
      });
    });
  }
}
