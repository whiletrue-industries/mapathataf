import { AfterViewInit, Component, computed, effect, ElementRef, Input, OnDestroy, signal, Signal, ViewChild, WritableSignal } from '@angular/core';
import { MapboxService } from '../mapbox.service';
import mapboxgl from 'mapbox-gl';
import { PlatformService } from '../platform.service';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.component.html',
  styleUrl: './map.component.less'
})
export class MapComponent implements AfterViewInit, OnDestroy {

  @ViewChild('map') mapContainer: ElementRef<HTMLDivElement>;
  map = signal<mapboxgl.Map | null>(null);

  LAYERS = [
    'mh-active-border',
    'mh-active-bg',
    'mh-active-aura',
    'mh-inactive-icons',
    'mh-inactive-icon-bg',
    'mh-inactive-aura',
  ];


  data = computed<GeoJSON.GeoJSON>(() => {
    const activeId = this.api.selectedId();
    console.log('ITEMS:', this.api.items());
    return {
      type: 'FeatureCollection',
      features: this.api.items().filter((item) => {
        return item.info && item.info.lng && item.info.lat;
      }).map((item) => {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [item.info.lng, item.info.lat],
          },
          properties: {
            active: item.info._id === activeId,
            id: item.info._id,
          }
        };
      })
    };
  });

  constructor(private mapboxService: MapboxService, private platform: PlatformService, private api: ApiService) {
    console.log('MapComponent constructor');
    effect(() => {
      const data = this.data();
      const map = this.map();
      if (map && data) {
        (map.getSource('points') as mapboxgl.GeoJSONSource).setData(data);
        console.log('SET SOURCE DATA', data);
      }
    });
    effect(() => {
      const map = this.map();
      const selectedItem = this.api.selectedItem();
      if (map && selectedItem) {
        let zoom = map.getZoom();        
        if (zoom < 15) {
          zoom = 15;
        }
        map.flyTo({
          center: [selectedItem.info.lng, selectedItem.info.lat],
          zoom,
        });
      }
    });
    effect(() => {
      const map = this.map();
      const workspace = this.api.workspace();
      const padding = this.api.mapPaddingBottom();
      if (map && workspace) {
        if (workspace.bounds) {
          map.fitBounds(workspace.bounds, {animate: false, padding: {bottom: padding}});
        }
      }
    });
  }

  ngAfterViewInit() {
    this.platform.browser(() => {
      console.log('Make Map:', this.mapContainer.nativeElement, this.map);
      if (!this.map()) {
        const map = new mapboxgl.Map({
          container: this.mapContainer.nativeElement,
          style: this.mapboxService.STYLE,
          minZoom: 10,
          attributionControl: false,
          logoPosition: 'bottom-right',
        });
        map.on('load', () => {
          map.addSource('points', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [34.8, 32.2]
                },
                properties: {
                  active: true,
                  id: '0',
                }
              }]
            }
          });

          for (const layer of this.LAYERS) {
            const oldLayers = map.getStyle().layers || [];
            const layerIndex = oldLayers.findIndex(l => l.id === layer);
            const layerDef: any = oldLayers[layerIndex];
            const before = oldLayers[layerIndex + 1] && oldLayers[layerIndex + 1].id;

            map.removeLayer(layer);
            map.addLayer({
              id: layer,
              type: layerDef.type,
              source: 'points',
              layout: Object.assign(layerDef.layout || {}, {visibility: 'visible'}),
              paint: layerDef.paint || {},
              filter: layerDef.filter || [],
            }, before);
            if (layer.indexOf('mh-inactive') !== -1) {
              map.on('click', layer, (e) => {
                if (e?.features && e.features[0]?.properties) {
                  const props: any = e.features[0].properties;
                  this.api.selectedId.set(props.id || null);
                }
              });
              map.on('mousemove', layer, (e) => {
                map.getCanvas().style.cursor = 'pointer';
              });              
            }
          }          
          this.map.set(map);
        });
        map.on('click', (e) => {
          this.api.selectedId.set(null);
        });
        map.on('mousemove', (e) => {
          map.getCanvas().style.cursor = '';
        });
      }
    });
  }

  ngOnDestroy() {
    this.platform.browser(() => {
      const map = this.map()
      if (map) {
        map.remove();
        this.map.set(null);
      }
    });
  }
}
