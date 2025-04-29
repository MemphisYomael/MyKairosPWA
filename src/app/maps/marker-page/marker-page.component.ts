import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  signal,
  viewChild,
} from '@angular/core';
import mapboxgl from 'mapbox-gl'; // or "const mapboxgl = require('mapbox-gl');"
import { environment } from '../../../environments/environment';
import { v4 as UUIDv4 } from 'uuid';
import {MatChipsModule} from '@angular/material/chips';
import {MatCardModule} from '@angular/material/card';


mapboxgl.accessToken = environment.map_box;

interface Marker {
  id: string;
  mapboxMarker: mapboxgl.Marker;
}

@Component({
  selector: 'app-marker-page',
  standalone: true,
  imports: [MatChipsModule, MatCardModule, ],
  templateUrl: './marker-page.component.html',
  styleUrl: './marker-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class MarkerPageComponent implements AfterViewInit {

  markers = signal<Marker[]>([]);
  
  divElement = viewChild<ElementRef>('map');
  map = signal<mapboxgl.Map | null>(null);

  async ngAfterViewInit() {
    if (!this.divElement()?.nativeElement) return;
    const element = this.divElement()?.nativeElement;

    // const { lat, lng } = this.coordinates();
    const map = new mapboxgl.Map({
      container: element, // container ID
      style: 'mapbox://styles/mapbox/streets-v12', // style URL
      center: [-74.5000, 40.0000], // starting position [lng, lat]
      zoom: 11, // starting zoom
    });

    // const marker = new mapboxgl.Marker({
    //   // draggable: true,
    //   color:'  #2575fc'
    // })
    //   .setLngLat([-74.5000, 40.0000])
    //   .addTo(map);
      
    //   marker.on('dragend', (event) => {
    //     console.log(event.target.getLngLat())
    //   })

    this.mapListeners(map);
  }

   mapListeners(map: mapboxgl.Map) {
    map.addControl( new mapboxgl.FullscreenControl());
    map.addControl( new mapboxgl.NavigationControl());
    map.addControl( new mapboxgl.ScaleControl());

    map.on('click', (event) => {
      this.mapClick(event);
    })
    this.map.set(map)
  }

  mapClick(event: mapboxgl.MapMouseEvent){

    const color = '#xxxxxx'.replace(/x/g, (y) =>
      ((Math.random() * 16) | 0).toString(16)
    );

    if(!this.map) return;

    console.log(event.lngLat);
     const marker = new mapboxgl.Marker({
      // draggable: true,
      color: color
    })
      .setLngLat(event.lngLat)
      .addTo(this.map()!);
      
      marker.on('dragend', (event) => {
        console.log(event.target.getLngLat())
      })

      const newMarker: Marker = {
        id: UUIDv4(),
        mapboxMarker: marker,
      }

      this.markers.update((markers) => [
        ...markers, newMarker
      ]);

      console.log(this.markers());
  }

  mostrarMarker(marker: Marker){
    if(!this.map()) return;
    this.map()?.flyTo({
      center: marker.mapboxMarker.getLngLat()
    })
  }
}
