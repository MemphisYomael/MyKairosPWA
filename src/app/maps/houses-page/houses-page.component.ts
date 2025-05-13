import { KeysService } from './../../IA/keys.service';
import { Component, signal, Inject, OnInit, AfterViewInit } from '@angular/core';
import { MatButton, MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { v4 as uuid } from 'uuid';
import { MiniMapComponent } from '../mini-map/mini-map.component';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { HeaderCardComponent } from '../../shared/header-card/header-card.component';
import { FormsModule } from '@angular/forms';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { DomSanitizer } from '@angular/platform-browser';
import { YoutubeService } from '../../IA/youtube.service';
import { firstValueFrom, Observable, forkJoin, of } from 'rxjs';
import { Ilinks } from '../../interfaces/ilinks';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { switchMap, map, catchError } from 'rxjs/operators';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HeaderCardRedComponent } from "../../shared/header-card-red/header-card-red.component";

// Declaramos Bootstrap para usar el modal
declare var bootstrap: any;

export interface Place {
  id: string;
  name: string;
  description: string;
  price: number;
  lngLat: { lng: number; lat: number };
  tags: string[];
  ReviewYoutubeLink: string;
  safeReviewYoutubeLink?: any; // Agregado para la URL segura
  busquedaParaGoogleMaps: string;
}

@Component({
  selector: 'app-houses-page',
  standalone: true,
  imports: [
    MatChipsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatButton,
    MiniMapComponent,
    MatSliderModule,
    MatFormFieldModule,
    CommonModule,
    HeaderCardComponent,
    FormsModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatDialogModule,
    MatIconModule,
    HeaderCardRedComponent
],
  templateUrl: './houses-page.component.html',
  styleUrl: './houses-page.component.css',
})
export class HousesPageComponent implements OnInit, AfterViewInit {
  cargando = signal<boolean>(false);
  result = signal<Place[]>([]);
  prompt = signal<string>('');
  promtPredet = signal<string>(
    'Por favor, devuelve únicamente un arreglo en formato JSON limpio, si nada extra, donde cada elemento sea un objeto con las propiedades relevantes. No incluyas texto adicional ni explicaciones. Usarás esta interfaz para los objetos: Place {name: string (Debe tener 1. nombre del lugar. 2. ciudad en la que se encuentra. 3.Pais en el que esta. EJ. Playa Boca chica, Santo domingo, Republica Dominicana);description: string;price: number;tags: string[]; busquedaParaGoogleMaps: string (Dame lo que le debo decir a google maps para que me salga exactamente esta ubicacion y no otra)}. El usuario te pedira que busques un lugar, si no te dice pais, busca la mejor opcion de entre todos los paises y devuelvele los mejores lugares de diferentes paises. Si te especifica una pais, respondele con los mejores de ese pais. Si te especifica precio, buscale los mejores a ese precio y compara con las diferentes lugares para traerle la mejor opcion. Si no te dice precio, lanzale la mejor opcion sin tener en cuenta su precio o si es caro. Si te pide lugares de comida como restaurantes, dale las especificaciones del lugar y su especialidad. Respode los precios en dolares por defecto, a menos de que se te especifique la moneda. Esta es la petición del usuario la cual le responderás con este arreglo de objetos: '
  );

  // Para el modal
  placeModal: any;
  selectedPlace: Place | null = null;

  constructor(
    private googleGeminiPro: KeysService,
    private youtubeService: YoutubeService,
    private sanitizer: DomSanitizer,
    private api1DbService: ServicioApi1DbService,
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    this.googleGeminiPro.initialize(this.googleGeminiPro.keys);
  }

  places = signal<Place[]>([]);

  ngOnInit() {
    //this.getCoordinates("Playa Rincon, Republica Dominicana").subscribe((data) => {
    //  console.log(data);
    //})
  }

  ngAfterViewInit() {
    // Inicializar el modal de Bootstrap
    this.placeModal = new bootstrap.Modal(document.getElementById('placeModal'));
  }

  openDetailsModal(place: Place) {
    this.selectedPlace = place;
    // Mostrar el modal con Bootstrap
    this.placeModal.show();
  }

  getEmbedUrl(url: string) {
    let videoId = null;

    try {
      // Caso 1: URL corta (youtu.be/VIDEO_ID)
      const shortUrlMatch = url.match(/youtu\.be\/([^?]+)/);
      if (shortUrlMatch && shortUrlMatch[1]) {
        videoId = shortUrlMatch[1];
      } else {
        // Caso 2: URL larga (youtube.com/watch?v=VIDEO_ID)
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get("v");
      }

      if (!videoId) {
        throw new Error("No se pudo extraer el ID del video.");
      }

      // Se construye la URL para el iframe
      return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`);
    } catch (error) {
      console.error("URL no válida:", error);
      return null;
    }
  }

  extractVideoId(url: string): string {
    const match = url.match(/v=([^&]+)/);
    return match ? match[1] : url;
  }

  async openUrl(query: string) {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await window.open(googleSearchUrl, '_blank');
  }

  async generate(prompt: string) {
    this.cargando.set(true);
    this.result.set([]);
    try {
      const responseText = await this.googleGeminiPro.generateText(this.promtPredet() + prompt);
      console.log("Raw responseText:", responseText);
      // Limpieza de la respuesta
      let jsonString = responseText.trim();
      if (jsonString.startsWith("```json")) {
        jsonString = jsonString.substring(7);
      }
      if (jsonString.endsWith("```")) {
        jsonString = jsonString.substring(0, jsonString.length - 3);
      }
      jsonString = jsonString.trim();

      const jsonArray = JSON.parse(jsonString);

      // Asignar un ID único a cada elemento
      jsonArray.forEach((item: Place) => {
        item.id = uuid(); // Ensure each place has a unique ID
      });

      const coordinateRequests = jsonArray.map((item: Place) => {
        return this.getCoordinates(item.busquedaParaGoogleMaps).pipe(
          map((coordinatesData) => {
            if (coordinatesData && coordinatesData.features && coordinatesData.features.length > 0) {
              const coordinates = coordinatesData.features[0].geometry.coordinates;
              item.lngLat = { lng: coordinates[0], lat: coordinates[1] };
              console.log(coordinatesData)
            } else {
              console.warn(`No se encontraron coordenadas para ${item.name}`);
              item.lngLat = { lng: 0, lat: 0 }; // Valor por defecto si no se encuentran coordenadas
            }
            return item;
          }),
          catchError((error) => {
            console.error(`Error al obtener coordenadas para ${item.name}:`, error);
            item.lngLat = { lng: 0, lat: 0 }; // Valor por defecto en caso de error
            return of(item); // Retorna un observable con el item modificado
          })
        );
      });

      forkJoin(coordinateRequests).pipe(
        switchMap((itemsWithCoordinates: any) => {
          const videoRequests = itemsWithCoordinates.map((item: any) => {
            return this.youtubeService.searchVideos("Review de: " + item.name).pipe(
              map((videoResult) => {
                if (videoResult && videoResult.items && videoResult.items.length > 0) {
                  const videoId = videoResult.items[0].id.videoId;
                  item.ReviewYoutubeLink = `https://www.youtube.com/watch?v=${videoId}`;
                  console.log(item.ReviewYoutubeLink)
                  // Calcula y almacena la URL embebida segura en el objeto
                  const embedUrl = `https://www.youtube.com/embed/${videoId}`;
                  item.safeReviewYoutubeLink = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
                  console.log("Review: " + item.ReviewYoutubeLink, "videoId: " + videoId);
                } else {
                  item.ReviewYoutubeLink = '';
                  item.safeReviewYoutubeLink = '';
                }
                return item;
              }),
              catchError((videoError) => {
                console.error('Error al consultar YouTube:', videoError);
                item.ReviewYoutubeLink = '';
                item.safeReviewYoutubeLink = '';
                return of(item);
              })
            );
          });
          return forkJoin(videoRequests);
        })
      ).subscribe({
        next: (finalItems: any) => {
          this.result.set(finalItems);
          console.log('JSON convertido:', finalItems);
        },
        error: (error) => {
          console.error('Error en la cadena de observables:', error);
        },
        complete: () => {
          this.cargando.set(false);
          console.log("Respuesta final en el objeto: ", this.result());
          this.prompt.set("");
        }
      });
    } catch (error) {
      console.error('Error al convertir JSON:', error);
      this.cargando.set(false);
    }
  }

  guardarLink(url: string, titulo: string, descripcion: string, precio: number) {
    const link: Ilinks = {
      Nombre: titulo,
      Descripcion: descripcion,
      Stock: 1606,
      linkCompra: url,
      FotoPortada: url,
      Precio: precio
    }

    this.api1DbService.postLinks(link).subscribe((data) => {
      console.log(data);
      //quiero que le avise al usuario en la pantalla que se guardo en MyLinks
      alert('Link guardado en MyLinks!');
    })
  }

  embed(location: string) {
    location = encodeURIComponent(location);
    console.log(location);
    return `<iframe
    id="embed-map"
    width="600"
    height="450"
    style="border:0"
    loading="lazy"
    allowfullscreen
    referrerpolicy="no-referrer-when-downgrade"
    src="https://www.google.com/maps/embed/v1/place?key=${this.googleGeminiPro.keys}
    &q=${location}"
  ></iframe>`;
  }

  private mapboxApiUrl = 'https://api.mapbox.com/search/geocode/v6/forward';

  getCoordinates(placeName: string): Observable<any> {
    const url = `${this.mapboxApiUrl}?q=${encodeURIComponent(placeName)}&proximity=-83.748708,42.265837&limit=1&access_token=${environment.map_box}`;
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.get(url, { headers });
  }
}