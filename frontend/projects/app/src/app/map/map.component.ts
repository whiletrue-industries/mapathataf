import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { MapboxService } from '../mapbox.service';
import mapboxgl from 'mapbox-gl';
import { PlatformService } from '../platform.service';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.less'
})
export class MapComponent implements AfterViewInit, OnDestroy {

  @ViewChild('map') mapContainer: ElementRef<HTMLDivElement>;
  map: mapboxgl.Map | null = null;

  constructor(private mapboxService: MapboxService, private platform: PlatformService, private el: ElementRef) {
    console.log('MapComponent constructor');
  }

  ngAfterViewInit() {
    this.platform.browser(() => {
      console.log('Make Map:', this.mapContainer.nativeElement, this.map);
      if (!this.map) {
        this.map = new mapboxgl.Map({
          container: this.mapContainer.nativeElement,
          style: this.mapboxService.STYLE,
          minZoom: 10,
          attributionControl: false,
          logoPosition: 'bottom-right',
        });
      }
    });
  }

  ngOnDestroy() {
    this.platform.browser(() => {
      if (this.map) {
        this.map.remove();
        this.map = null;
      }
    });
  }
}
