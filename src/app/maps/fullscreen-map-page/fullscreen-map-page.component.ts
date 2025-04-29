import { FullscreenControlOptions } from './../../../../node_modules/mapbox-gl/dist/mapbox-gl.d';
import { map } from 'rxjs';
import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"
import { environment } from '../../../environments/environment';
import { MatSliderModule } from '@angular/material/slider';
import { DecimalPipe, JsonPipe } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

mapboxgl.accessToken = environment.map_box;

@Component({
  selector: 'app-fullscreen-map-page',
  standalone: true,
  imports: [MatSliderModule, DecimalPipe, JsonPipe, MatSlideToggleModule],
  templateUrl: './fullscreen-map-page.component.html',
  styleUrl: './fullscreen-map-page.component.css',
})
export class FullscreenMapPageComponent implements AfterViewInit {
  mostrarCoordenadas = signal(true);
  divElement = viewChild<ElementRef>('map');
  zoom = signal(14);
  coordinates = signal({
    lng: -74.5,
    lat: 40,
  });
  map = signal<mapboxgl.Map | null>(null);
  zoomEfect = effect(() => {
    if (!this.map) return;
    this.map()?.setZoom(this.zoom());
  });

  async ngAfterViewInit() {
    if (!this.divElement()?.nativeElement) return;
    const element = this.divElement()?.nativeElement;

    const { lat, lng } = this.coordinates();
    const map = new mapboxgl.Map({
      container: element, // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [lng, lat], // starting position [lng, lat]
      zoom: this.zoom(), // starting zoom
    });

    this.mapListeners(map);
  }

  mapListeners(map: mapboxgl.Map) {
    map.on('zoomend', (event) => {
      const newZoom = event.target.getZoom();
      this.zoom.set(newZoom);
    });

    map.on('moveend', (event) => {
      const center = event.target.getCenter();
      this.coordinates.set(center);
    });

    map.addControl( new mapboxgl.FullscreenControl());
    map.addControl( new mapboxgl.NavigationControl());
    map.addControl( new mapboxgl.ScaleControl());

    this.map.set(map);

  }
}
