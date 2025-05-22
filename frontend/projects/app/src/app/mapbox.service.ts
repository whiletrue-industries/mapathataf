import { Injectable } from '@angular/core';
import mapboxgl, { Map } from "mapbox-gl";

@Injectable({
  providedIn: 'root'
})
export class MapboxService {

  STYLE = 'mapbox://styles/treebase/cmazg83bc00as01qx6wwhak14/draft';
  
  constructor() {
      (mapboxgl as any).accessToken = 'pk.eyJ1IjoidHJlZWJhc2UiLCJhIjoiY2xjazVueWFnMHBscDN2bXRkdjh1dHd1cyJ9.zcn36ZZJ9b0RJlYJTSZYOA';
  }
}
