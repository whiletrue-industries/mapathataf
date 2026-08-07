import { AfterViewInit, Component, effect, ElementRef, inject, input, OnDestroy, output, PLATFORM_ID, signal, ViewChild } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import mapboxgl from 'mapbox-gl';

// Same public browser token + style the map app uses
const ACCESS_TOKEN = 'pk.eyJ1IjoidHJlZWJhc2UiLCJhIjoiY2xjazVueWFnMHBscDN2bXRkdjh1dHd1cyJ9.zcn36ZZJ9b0RJlYJTSZYOA';
const STYLE = 'mapbox://styles/treebase/cmazg83bc00as01qx6wwhak14/draft';
const ISRAEL_CENTER: [number, number] = [35.0, 31.8];
// Keep the widget in the Israel region - no zooming out to the whole globe
const MAX_BOUNDS: [[number, number], [number, number]] = [[32.5, 28.7], [37.5, 34.5]];
const MIN_ZOOM = 6;

function boundsPolygon(bounds: number[]): GeoJSON.Feature {
  const [minLon, minLat, maxLon, maxLat] = bounds;
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [minLon, minLat], [maxLon, minLat], [maxLon, maxLat], [minLon, maxLat], [minLon, minLat],
      ]],
    },
  };
}

@Component({
  selector: 'app-bounds-editor',
  imports: [],
  templateUrl: './bounds-editor.component.html',
  styleUrl: './bounds-editor.component.less'
})
export class BoundsEditorComponent implements AfterViewInit, OnDestroy {
  bounds = input<number[] | undefined>(undefined);
  update = output<number[]>();

  @ViewChild('mapContainer') mapContainer: ElementRef<HTMLDivElement>;

  pending = signal<number[] | null>(null);
  dirty = signal(false);
  drawing = signal(false);

  display = signal<number[] | null>(null);

  private browser = isPlatformBrowser(inject(PLATFORM_ID));
  private map: mapboxgl.Map | null = null;
  private drawStart: mapboxgl.LngLat | null = null;

  constructor() {
    effect(() => {
      const bounds = this.bounds();
      this.pending.set(null);
      this.dirty.set(false);
      this.display.set(bounds || null);
      this.showBounds(bounds || null, true);
    });
  }

  ngAfterViewInit() {
    if (!this.browser) {
      return;
    }
    mapboxgl.accessToken = ACCESS_TOKEN;
    if (mapboxgl.getRTLTextPluginStatus() === 'unavailable') {
      mapboxgl.setRTLTextPlugin('/mapbox-gl-rtl-text.js', () => {}, true);
    }
    this.map = new mapboxgl.Map({
      container: this.mapContainer.nativeElement,
      style: STYLE,
      center: ISRAEL_CENTER,
      zoom: 6.5,
      minZoom: MIN_ZOOM,
      maxBounds: MAX_BOUNDS,
      attributionControl: false,
    });
    this.map.addControl(new mapboxgl.NavigationControl({showCompass: false}));
    this.map.on('load', () => {
      this.map?.addSource('bounds', {type: 'geojson', data: {type: 'FeatureCollection', features: []}});
      this.map?.addLayer({
        id: 'bounds-fill', type: 'fill', source: 'bounds',
        paint: {'fill-color': '#053856', 'fill-opacity': 0.08},
      });
      this.map?.addLayer({
        id: 'bounds-line', type: 'line', source: 'bounds',
        paint: {'line-color': '#053856', 'line-width': 2, 'line-dasharray': [2, 1]},
      });
      this.showBounds(this.bounds() || null, true);
    });
    this.map.on('mousedown', (e) => this.drawMouseDown(e));
    this.map.on('mousemove', (e) => this.drawMouseMove(e));
    this.map.on('mouseup', (e) => this.drawMouseUp(e));
  }

  ngOnDestroy() {
    this.map?.remove();
    this.map = null;
  }

  private showBounds(bounds: number[] | null, fit: boolean) {
    const map = this.map;
    if (!map || !map.getSource('bounds')) {
      return;
    }
    const source = map.getSource('bounds') as mapboxgl.GeoJSONSource;
    source.setData(bounds && bounds.length === 4 ?
      boundsPolygon(bounds) : {type: 'FeatureCollection', features: []});
    if (fit && bounds && bounds.length === 4) {
      map.fitBounds([[bounds[0], bounds[1]], [bounds[2], bounds[3]]], {padding: 40, animate: false});
    }
  }

  toggleDraw() {
    const drawing = !this.drawing();
    this.drawing.set(drawing);
    this.drawStart = null;
    const map = this.map;
    if (map) {
      if (drawing) {
        map.dragPan.disable();
        map.getCanvas().style.cursor = 'crosshair';
      } else {
        map.dragPan.enable();
        map.getCanvas().style.cursor = '';
      }
    }
  }

  private static rect(a: mapboxgl.LngLat, b: mapboxgl.LngLat): number[] {
    return [
      Number(Math.min(a.lng, b.lng).toFixed(5)), Number(Math.min(a.lat, b.lat).toFixed(5)),
      Number(Math.max(a.lng, b.lng).toFixed(5)), Number(Math.max(a.lat, b.lat).toFixed(5)),
    ];
  }

  private drawMouseDown(e: mapboxgl.MapMouseEvent) {
    if (this.drawing()) {
      e.preventDefault();
      this.drawStart = e.lngLat;
    }
  }

  private drawMouseMove(e: mapboxgl.MapMouseEvent) {
    if (this.drawing() && this.drawStart) {
      this.showBounds(BoundsEditorComponent.rect(this.drawStart, e.lngLat), false);
    }
  }

  private drawMouseUp(e: mapboxgl.MapMouseEvent) {
    if (this.drawing() && this.drawStart) {
      const bounds = BoundsEditorComponent.rect(this.drawStart, e.lngLat);
      this.drawStart = null;
      this.toggleDraw();
      if (bounds[0] === bounds[2] || bounds[1] === bounds[3]) {
        this.showBounds(this.display(), false);
        return;
      }
      this.pending.set(bounds);
      this.display.set(bounds);
      this.dirty.set(true);
      this.showBounds(bounds, false);
    }
  }

  setFromView() {
    if (!this.map) {
      return;
    }
    const view = this.map.getBounds();
    if (!view) {
      return;
    }
    const bounds = [
      Number(view.getWest().toFixed(5)), Number(view.getSouth().toFixed(5)),
      Number(view.getEast().toFixed(5)), Number(view.getNorth().toFixed(5)),
    ];
    this.pending.set(bounds);
    this.display.set(bounds);
    this.dirty.set(true);
    this.showBounds(bounds, false);
  }

  cancel() {
    this.pending.set(null);
    this.dirty.set(false);
    this.display.set(this.bounds() || null);
    this.showBounds(this.bounds() || null, true);
  }

  save() {
    const bounds = this.pending();
    if (bounds) {
      this.dirty.set(false);
      this.update.emit(bounds);
    }
  }
}
