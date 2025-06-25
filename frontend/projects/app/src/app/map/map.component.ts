import { AfterViewInit, Component, computed, effect, ElementRef, Input, OnDestroy, signal, Signal, ViewChild, WritableSignal } from '@angular/core';
import { MapboxService } from '../mapbox.service';
import mapboxgl from 'mapbox-gl';
import { PlatformService } from '../platform.service';
import { ApiService } from '../api.service';
import { StateService } from '../state.service';

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
    const activeId = this.state.selectedId();
    return {
      type: 'FeatureCollection',
      features: this.state.items().filter((item) => {
        return item.resolved && item.resolved.lng && item.resolved.lat;
      }).map((item) => {
        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [item.resolved.lng, item.resolved.lat],
          },
          properties: {
            active: item.info._id === activeId,
            id: item.info._id,
            kind: item.resolved.facility_kind,
          }
        };
      })
    };
  });
  initializedView = signal(false);

  constructor(private mapboxService: MapboxService, private platform: PlatformService, private api: ApiService, private state: StateService) {
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
      const selectedItem = this.state.selectedItem();
      if (map && selectedItem) {
        let zoom = map.getZoom();        
        if (zoom < 15) {
          zoom = 15;
        }
        map.flyTo({
          center: [selectedItem.resolved.lng, selectedItem.resolved.lat],
          zoom,
        });
      }
    });
    effect(() => {
      const map = this.map();
      const workspace = this.api.workspace();
      const padding = this.state.mapPaddingBottom();
      const askZoom = this.state.askZoom();
      const initializedView = this.initializedView();
      if (map) {
        if (!initializedView && askZoom) {
          map.flyTo({
            center: [askZoom[0], askZoom[1]],
            zoom: askZoom[2],
            animate: false,          
          });
          this.initializedView.set(true);
        } else if (!initializedView && workspace) {
          if (workspace.bounds) {
            map.fitBounds(workspace.bounds, {animate: false, padding: {bottom: padding, top: 58}});
            this.initializedView.set(true);
          }
        } else {
          map.jumpTo({
            center: map.getCenter(),
            zoom: map.getZoom(),
            padding: { bottom: padding, top: 58}
          });
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
        this.mapboxService.map = map;
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
                  this.state.selectedId.set(props.id || null);
                }
              });
              map.on('mousemove', layer, (e) => {
                map.getCanvas().style.cursor = 'pointer';
              });              
            }
          }

          map.on('moveend', () => {
            this.state.mapState.set(map.getCenter().toArray().concat(map.getZoom()));
          });

          this.map.set(map);
        });
        map.on('click', (e) => {
          this.state.selectedId.set(null);
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
