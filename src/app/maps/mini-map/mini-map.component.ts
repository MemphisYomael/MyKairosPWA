import { Component, effect, ElementRef, input, signal, viewChild } from '@angular/core';
import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"

@Component({
  selector: 'app-mini-map',
  standalone: true,
  imports: [],
  templateUrl: './mini-map.component.html',
  styleUrl: './mini-map.component.css'
})
export class MiniMapComponent {

  lngLat = input.required<{lng: number, lat: number}>()
  mostrarCoordenadas = signal(true);
  divElement = viewChild<ElementRef>('map');
  zoom = input<number | string>(1);
  coordinates = signal({
    lng: -74.5,
    lat: 40,
  });
  map = signal<mapboxgl.Map | null>(null);
  zoomEfect = effect(() => {
    if (!this.map) return;
    this.map()?.setZoom(Number(this.zoom()));
  });

  async ngAfterViewInit() {
    if (!this.divElement()?.nativeElement) return;
    const element = this.divElement()?.nativeElement;

    const { lat, lng } = this.coordinates();
    const map = new mapboxgl.Map({
      container: element, // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: this.lngLat(), // starting position [lng, lat]
      zoom: Number(this.zoom()), // starting zoom
      interactive: true
    });

    this.mapListeners(map);
   
    new mapboxgl.Marker()
    .setLngLat(this.lngLat())
    .addTo(map)

  }

  mapListeners(map: mapboxgl.Map) {
    map.on('moveend', (event) => {
      const center = event.target.getCenter();
      this.coordinates.set(center);
    });
    

    map.addControl( new mapboxgl.FullscreenControl());
    this.map.set(map);

  }
}
