// my-links.component.ts (actualizado)
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Ilinks } from '../../interfaces/ilinks';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CrearLinksComponent } from '../crear-links/crear-links.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AccionesComponent } from '../../shared/acciones/acciones.component';
// Importamos Storage de Capacitor
import { Storage } from '@capacitor/storage';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { DomSanitizer } from '@angular/platform-browser';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { YoutubeSearchComponent } from "../../shared/youtube-search/youtube-search.component";

// Declaramos Bootstrap para usar el modal
declare var bootstrap: any;

@Component({
  selector: 'app-my-links',
  standalone: true,
  imports: [
    MatSlideToggleModule,
    MatSlideToggle,
    CommonModule,
    MatCardModule,
    FormsModule,
    MatIcon,
    MatButtonModule,
    MatGridListModule,
    HeaderCardComponent,
    YoutubeSearchComponent
],
  templateUrl: './my-links.component.html',
  styleUrl: './my-links.component.css'
})
export class MyLinksComponent {
  email: string | null  = "";
  compartidosConmigo = signal<boolean>(false);
  togleStatus = signal(false);
  links = signal<any[]>([]);
  cols = signal(3);
  rowHeight = signal('2:1');
  private _bottomSheet = inject(MatBottomSheet);
  
  // Para el modal
  selectedLink: any = null;
  private linkModal: any;

  constructor(
    private servicioCompartido: ComunicacionEntreComponentesService,
    private http: HttpClient,
    private dialog: MatDialog,
    private serviceApi1Db: ServicioApi1DbService,
    private breakpointObserver: BreakpointObserver,
    private sanitizer: DomSanitizer,
  ) {}

  async ngOnInit() {
    this.servicioCompartido.barraInferior.set(false);
    await this.recuperarDataDelStorage();
    await this.getLinks();
    this.email = this.serviceApi1Db.getEmail();

    // Ajusta el layout según el breakpoint (móviles vs escritorio)
    await this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      if (result.matches) {
        this.cols.set(1);           // Una columna en móviles
        this.rowHeight.set('4:1');    // Mayor altura en móviles
      } else {
        this.cols.set(3);
        this.rowHeight.set('2:1');
      }
    });
  }

  ngAfterViewInit() {
    // Inicializar el modal de Bootstrap
    this.linkModal = new bootstrap.Modal(document.getElementById('linkModal'));
  }

  openLinkModal(link: any) {
    this.selectedLink = link;
    // Abrir el modal usando Bootstrap
    this.linkModal.show();
  }

  toggleStatusFunction(checked: boolean): void {
    this.togleStatus.set(checked);
    // Aquí puedes agregar la lógica para manejar el cambio de estado
  }
  
  toggleStatusShared(checked: boolean) {
    this.compartidosConmigo.set(checked)
  }
  
  async openBottomSheet(link: any) {
    await this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: 'links-productos',
        objeto: link
      }
    }).afterDismissed().subscribe(()=>{
      this.getLinks();
    });
  }

  async getLinks() {
    if (navigator.onLine) {
      this.serviceApi1Db.getLinks().subscribe(
        async (data: Ilinks[]) => {
          this.links.set(data);
          console.log('Data from API:', data);
          // Guarda la data en Storage
          await Storage.set({
            key: 'links',
            value: JSON.stringify(data)
          });
          console.log('Data saved in Storage.');
        },
        async (error) => {
          console.error('Error calling API:', error);
          // En caso de error, se recupera la data del Storage
          const { value } = await Storage.get({ key: 'links' });
          if (value) {
            this.links.set(JSON.parse(value));
            console.log('Data loaded from Storage due to API error.');
          }
        }
      );
    } else {
      // Sin conexión: recuperar la data desde Storage
      const { value } = await Storage.get({ key: 'links' });
      if (value) {
        this.links.set(JSON.parse(value));
        console.log('User offline: data loaded from Storage.');
      } else {
        console.log('User offline and no data found in Storage.');
      }
    }
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(CrearLinksComponent, {
      disableClose: false,
      data: {},
      width: '300px'
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Dialog closed');
      this.getLinks();
    });
  }

  async openLink(url: string) {
    await window.open(url, '_blank');
  }

  async extractYouTubeId(url: string) {
    const regExp = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = url.match(regExp);
    return match && match[1] ? match[1] : null;
  }

  private defaultThumbnail = 'assets/default_thumbnail.jpg';

  async getThumbnail(url: string) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = this.extractYouTubeId(url);
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    }
    return url;
  }

  async recuperarDataDelStorage(){
    const { value } = await Storage.get({ key: 'links' });
    if (value) {
      this.links.set(JSON.parse(value));
      console.log('User offline: data loaded from Storage.');
    } 
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
  
  ngOnDestroy(){
    this.servicioCompartido.barraInferior.set(true);
  }
}