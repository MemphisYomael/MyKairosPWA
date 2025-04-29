import { Component, signal, OnInit, AfterViewInit } from '@angular/core';
import { KeysService } from '../keys.service';
import { YoutubeService } from '../youtube.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatExpansionModule } from '@angular/material/expansion';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { firstValueFrom } from 'rxjs';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Ilinks } from '../../interfaces/ilinks';
import { v4 as uuid } from 'uuid';

declare var bootstrap: any;


export interface Gemini {
  id?: string; // Added id field similar to Place
  Producto: string;
  ProductoImagenUrl: string;
  Precio: number;
  UrlAmazon: string;
  UrlOtraTienda: string;
  Descripcion: string;
  ValoracionIA: string;
  ValoracionUnoAlDiez: number;
  ReviewYoutubeLink: string;
  safeReviewYoutubeLink?: SafeResourceUrl;
}

@Component({
  selector: 'app-gemini-app-1',
  standalone: true,
  imports: [
    MatExpansionModule,
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    HeaderCardComponent
  ],
  templateUrl: './gemini-app-1.component.html',
  styleUrls: ['./gemini-app-1.component.css']
})
export class GeminiApp1Component implements OnInit, AfterViewInit {
  cargando = signal<boolean>(false);
  result = signal<Gemini[]>([]);
  prompt = signal<string>("");
  promtPredet = signal<string>('Por favor, devuelve únicamente un arreglo en formato JSON limpio, si nada extra, donde cada elemento sea un objeto con las propiedades relevantes. No incluyas texto adicional ni explicaciones. Usarás esta interfaz para los objetos: interface Gemini{Producto: string; ProductoImagenUrl: string; Precio: number; UrlAmazon: string; UrlOtraTienda: string; Descripcion: string; ValoracionIA: string; ValoracionUnoAlDiez: number;}. El usuario te pedira que busques un producto, si no te dice marca, busca la mejor opcion de entre todas las marcas y devuelvele los mejores de diferentes marcas. Si te especifica una marca, respondele con los mejores de esa marca. Si te especifica precio, buscale los mejores a ese precio y compara con las diferentes marcas para traerle la mejor opcion. Si no te dice precio, lanzale la mejor opcion sin tener en cuenta su precio o si es caro. Si te pide productos electronicos como celulares o laptops o televisores, dale las especificaciones de potencia, multitarea y calidad de imagen. Si es un objeto, describele la calidad y materiales de construccion, asi como otras caracteristicas utiles para hacer una eleccion. Si es comida, especificale el tipo de comida, por que la elegiste por encima de otras, dale opciones de diferentes empresas que la distribuyen, y el precio por el que ronda. Si alguno de estos productos estan en amazon, trae un link de cada producto en amazon. Si es un servicio de streaming, comparale el precio y lo que ofrece cada uno. Si es otro tipo de servicio, compara los servicios y sus diferentes precios, da abundante detalle de lo que ofrecen. Si son videojuegos, responde con los mejor valorados. Respode los precios en dolares por defecto, a menos de que se te especifique la moneda. Esta es la petición del usuario la cual le responderás con este arreglo de objetos: ');

  // Para manejar el modal
  productModal: any;
  selectedProduct: Gemini | null = null;

  constructor(
    private googleGeminiPro: KeysService,
    private youtubeService: YoutubeService,
    private sanitizer: DomSanitizer,
    private api1DbService: ServicioApi1DbService
  ) {
    this.googleGeminiPro.initialize(this.googleGeminiPro.keys);
  }

  ngOnInit() {
    // Cualquier inicialización necesaria
  }

  ngAfterViewInit() {
    // Inicializar el modal de Bootstrap
    this.productModal = new bootstrap.Modal(document.getElementById('productModal'));
  }

  openDetailsModal(product: Gemini) {
    this.selectedProduct = product;
    // Mostrar el modal con Bootstrap
    this.productModal.show();
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
      const processedItems: Gemini[] = [];
      
      for (const item of jsonArray) {
        // Asignar un ID único
        item.id = uuid();
        
        try {
          // Búsqueda en YouTube
          const videoResult = await firstValueFrom(this.youtubeService.searchVideos("Review de: " + item.Producto));
          if (videoResult && videoResult.items && videoResult.items.length > 0) {
            const videoId = videoResult.items[0].id.videoId;
            item.ReviewYoutubeLink = `https://www.youtube.com/watch?v=${videoId}`;
            // Calcula y almacena la URL embebida segura en el objeto
            const embedUrl = `https://www.youtube.com/embed/${videoId}`;
            item.safeReviewYoutubeLink = this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
            console.log("Review: " + item.ReviewYoutubeLink, "videoId: " + videoId);
          } else {
            item.ReviewYoutubeLink = '';
            item.safeReviewYoutubeLink = '';
          }
        } catch (videoError) {
          console.error('Error al consultar YouTube:', videoError);
          item.ReviewYoutubeLink = '';
          item.safeReviewYoutubeLink = '';
        }
        
        processedItems.push(item);
      }
      
      this.result.set(processedItems);
      console.log('JSON procesado:', processedItems);
    } catch (error) {
      console.error('Error al convertir JSON:', error);
    }
    
    this.cargando.set(false);
    console.log("Respuesta final en el objeto: ", this.result());
    this.prompt.set("");
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
    });
  }
}