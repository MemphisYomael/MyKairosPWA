// my-links.component.ts (actualizado con funcionalidad offline)
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { Ilinks } from '../../interfaces/ilinks';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CrearLinksComponent } from '../crear-links/crear-links.component';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatBadgeModule } from '@angular/material/badge';
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
import { merge } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { OfflineLinksService } from '../../services/MyLinksOffline/OfflineLinks.service';

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
    YoutubeSearchComponent,
    MatBadgeModule
  ],
  templateUrl: './my-links.component.html',
  styleUrl: './my-links.component.css'
})
export class MyLinksComponent {
  email: string | null = "";
  compartidosConmigo = signal<boolean>(false);
  togleStatus = signal(false);
  links = signal<any[]>([]);
  pendingSyncCount = signal(0);
  isOnline = signal(navigator.onLine);
  cols = signal(3);
  rowHeight = signal('2:1');
  private _bottomSheet = inject(MatBottomSheet);
  
  // Para el modal
  selectedLink: any = null;
  public linkModal: any;

  constructor(
    private servicioCompartido: ComunicacionEntreComponentesService,
    private http: HttpClient,
    private dialog: MatDialog,
    private serviceApi1Db: ServicioApi1DbService,
    private offlineLinksService: OfflineLinksService,
    private snackBar: MatSnackBar,
    private breakpointObserver: BreakpointObserver,
    private sanitizer: DomSanitizer,
  ) {
    // Monitorear cambios en la conexión a Internet
    window.addEventListener('online', () => this.handleConnectionChange(true));
    window.addEventListener('offline', () => this.handleConnectionChange(false));
  }

  handleConnectionChange(isOnline: boolean) {
    this.isOnline.set(isOnline);
    
    if (isOnline) {

      // Intentar sincronizar datos offline cuando hay conexión
      this.syncOfflineData();
    }
  }

  async ngOnInit() {
    this.servicioCompartido.barraInferior.set(false);
    this.email = this.serviceApi1Db.getEmail();
    
    // Actualizar el contador de elementos pendientes de sincronización
    this.updatePendingSyncCount();
    
    // Cargar todos los datos disponibles (local y offline)
    await this.loadAllData();

    // Ajusta el layout según el breakpoint (móviles vs escritorio)
    await this.breakpointObserver.observe([Breakpoints.Handset]).subscribe(result => {
      if (result.matches) {
        this.cols.set(1);           // Una columna en móviles
        this.rowHeight.set('4:1');  // Mayor altura en móviles
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

  async updatePendingSyncCount() {
    // Actualizar contador de elementos pendientes de sincronización
    this.pendingSyncCount.set(this.offlineLinksService.getPendingSyncCount());
  }

  async loadAllData() {
    try {
      // 1. Cargar datos del almacenamiento local primero
      await this.recuperarDataDelStorage();
      
      // 2. Mezclar con datos creados y editados offline
      await this.mergeOfflineData();
      
      // 3. Si hay conexión, intentar sincronizar y luego obtener datos actualizados de la API
      if (navigator.onLine) {
        await this.syncOfflineData();
        await this.getLinks();
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  }

  async mergeOfflineData() {
    // Obtener links creados offline
    this.offlineLinksService.getOfflineLinks().pipe(take(1)).subscribe(offlineLinks => {
      // Obtener ediciones offline
      this.offlineLinksService.getOfflineEdits().pipe(take(1)).subscribe(offlineEdits => {
        // Clonar la lista actual
        const currentLinks = [...this.links()];
        
        // Añadir links creados offline
        offlineLinks.forEach(offlineLink => {
          // Verificar que no existe ya en la lista (por si acaso)
          if (!currentLinks.some(link => link.id === offlineLink.id)) {
            currentLinks.push(offlineLink);
          }
        });
        
        // Aplicar ediciones offline
        offlineEdits.forEach(editedLink => {
          const index = currentLinks.findIndex(link => link.id === editedLink.id);
          if (index >= 0) {
            // Reemplazar con la versión editada
            currentLinks[index] = editedLink;
          }
        });
        
        // Actualizar la lista de links
        this.links.set(currentLinks);
      });
    });
  }

  async syncOfflineData() {
    if (!navigator.onLine) {
      console.log('No hay conexión, no se puede sincronizar');
      return;
    }
    
    try {
      // Intentar sincronizar datos offline
      const success = await this.offlineLinksService.syncOfflineData();
      
      if (success) {
        
        // Actualizar contador después de sincronizar
        this.updatePendingSyncCount();
      }
    } catch (error) {
      console.error('Error al sincronizar datos:', error);
      this.snackBar.open('Error al sincronizar datos', 'Cerrar', {
        duration: 3000
      });
    }
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
    this.compartidosConmigo.set(checked);
  }
  
  async openBottomSheet(link: any) {
    await this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: 'links-productos',
        objeto: link
      }
    }).afterDismissed().subscribe(() => {
      this.loadAllData();
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
          await this.recuperarDataDelStorage();
        }
      );
    } else {
      // Sin conexión: recuperar la data desde Storage y mezclar con datos offline
      await this.recuperarDataDelStorage();
      await this.mergeOfflineData();
    }
  }

  openDialog(isEdit: boolean = false, objeto?: Ilinks): void {
    const dialogRef = this.dialog.open(CrearLinksComponent, {
      disableClose: false,
      data: {
        isEdit: isEdit,
        objeto: objeto || null,
        compartirLink: false
      },
      width: '300px'
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Dialog closed');
      this.loadAllData();
      this.updatePendingSyncCount();
    });
  }

  editLink(link: Ilinks) {
    this.openDialog(true, link);
  }

  openShareDialog(link: Ilinks): void {
    const dialogRef = this.dialog.open(CrearLinksComponent, {
      disableClose: false,
      data: {
        isEdit: false,
        objeto: link,
        compartirLink: true
      },
      width: '300px'
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Share dialog closed');
      this.loadAllData();
      this.updatePendingSyncCount();
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

  async recuperarDataDelStorage() {
    const { value } = await Storage.get({ key: 'links' });
    if (value) {
      this.links.set(JSON.parse(value));
      console.log('Data loaded from Storage.');
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
}