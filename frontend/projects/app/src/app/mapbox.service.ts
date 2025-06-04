import { Injectable } from '@angular/core';
import mapboxgl, { Map } from "mapbox-gl";
import { PlatformService } from './platform.service';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapboxService {

  STYLE = 'mapbox://styles/treebase/cmazg83bc00as01qx6wwhak14/draft';

  init = new ReplaySubject<boolean>(1);

  constructor(private platform: PlatformService) {
    console.log('MAPBOX SERVICE CONSTRUCTOR');
    (mapboxgl as any).accessToken = 'pk.eyJ1IjoidHJlZWJhc2UiLCJhIjoiY2xjazVueWFnMHBscDN2bXRkdjh1dHd1cyJ9.zcn36ZZJ9b0RJlYJTSZYOA';
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
}
