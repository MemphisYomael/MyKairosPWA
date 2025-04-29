import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged, Subscription } from 'rxjs';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Ilinks } from '../../interfaces/ilinks';
import { YoutubeService } from '../../IA/youtube.service';
import { MessageService } from '../../services/message.service';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';

declare var bootstrap: any;

export interface VideoResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  embedUrl: SafeResourceUrl;
}

@Component({
  selector: 'app-youtube-search',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './youtube-search.component.html',
  styleUrls: ['./youtube-search.component.css']
})
export class YoutubeSearchComponent implements OnInit, OnDestroy {
  @Input() fromChat = false; // Nuevo: Para saber si se abrió desde el chat
  
  searchQuery: string = '';
  isLoading = false;
  searchResults: VideoResult[] = [];
  searchTerms = new Subject<string>();
  private searchSubscription: Subscription | null = null;
  youtubeModal: any;
  
  constructor(
    private youtubeService: YoutubeService,
    private sanitizer: DomSanitizer,
    private api1DbService: ServicioApi1DbService,
    private messageService: MessageService,
    private comunicacionService: ComunicacionEntreComponentesService
  ) {}

  ngOnInit(): void {
    // Configurar el debounce para la búsqueda
    this.searchSubscription = this.searchTerms.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(term => {
      this.searchYouTubeVideos(term);
    });
    
    // Inicializar el modal que no se cierra al hacer clic afuera
    setTimeout(() => {
      const modalElement = document.getElementById('youtubeSearchModal');
      if (modalElement) {
        this.youtubeModal = new bootstrap.Modal(modalElement, {
          backdrop: 'static',
          keyboard: false
        });
      }
    }, 0);
  }
  
  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }
  
  // Método para abrir el modal
  openModal(): void {
    if (this.youtubeModal) {
      this.youtubeModal.show();
    } else {
      setTimeout(() => {
        const modalElement = document.getElementById('youtubeSearchModal');
        if (modalElement) {
          this.youtubeModal = new bootstrap.Modal(modalElement, {
            backdrop: 'static',
            keyboard: false
          });
          this.youtubeModal.show();
        }
      }, 100);
    }
  }
  
  // Método para cerrar el modal
  closeModal(): void {
    if (this.youtubeModal) {
      this.youtubeModal.hide();
    }
  }
  
  onSearchInput(term: string): void {
    this.searchTerms.next(term);
  }
  
  searchYouTubeVideos(query: string): void {
    if (!query.trim()) {
      this.searchResults = [];
      return;
    }
    
    this.isLoading = true;
    this.youtubeService.searchVideos(query, 5).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        this.processYouTubeResults(response);
      },
      error: (error: any) => {
        console.error('Error searching YouTube videos:', error);
        this.isLoading = false;
        this.searchResults = [];
      }
    });
  }
  
  processYouTubeResults(response: any): void {
    if (response && response.items) {
      this.searchResults = response.items.map((item: any) => {
        const videoId = item.id.videoId;
        return {
          id: videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnailUrl: item.snippet.thumbnails.medium.url,
          videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
          embedUrl: this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}`)
        };
      });
    } else {
      this.searchResults = [];
    }
  }
  
  saveToMyLinks(video: VideoResult): void {
    const link: Ilinks = {
      Nombre: video.title,
      Descripcion: video.description,
      Stock: 0,
      linkCompra: video.videoUrl,
      FotoPortada: video.thumbnailUrl,
      Precio: 0
    };
    
    this.api1DbService.postLinks(link).subscribe({
      next: (data) => {
        console.log('Link guardado:', data);
        alert('Video guardado en MyLinks!');
      },
      error: (error) => {
        console.error('Error al guardar en MyLinks:', error);
        alert('Error al guardar el video');
      }
    });
  }

  // Nuevo método para enviar el video al chat
  sendToChat(video: VideoResult): void {
    if (this.fromChat && this.comunicacionService.personaChat()) {
      const mensaje = {
        RecipientUserName: this.comunicacionService.personaChat(),
        Content: video.videoUrl
      };

      this.messageService.enviarMensaje(mensaje).then((data) => {
        console.log('Video enviado al chat:', data);
        this.closeModal();
      }).catch(error => {
        console.error('Error al enviar video al chat:', error);
        alert('Error al enviar el video al chat');
      });
    }
  }
}