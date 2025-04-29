import { Component, inject, signal, computed } from '@angular/core';
import { HeaderCardComponent } from '../../shared/header-card/header-card.component';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CrearWordComponent } from '../crear-word/crear-word.component';
import { MatDialog } from '@angular/material/dialog';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { IsermonResponse } from '../../interfaces/isermon-response';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AccionesComponent } from '../../shared/acciones/acciones.component';
import { RouterLink, Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { Storage } from '@capacitor/storage';
import { DatePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { MatSnackBar } from '@angular/material/snack-bar';

// Importamos la declaración para Bootstrap
declare var bootstrap: any;

@Component({
  selector: 'app-editor-inicio',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatCardModule,
    MatGridListModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    HeaderCardComponent,
    RouterLink,
    DatePipe,
    MatChipsModule,
  ],
  templateUrl: './editor-inicio.component.html',
  styleUrls: ['./editor-inicio.component.css']
})
export class EditorInicioComponent {
  private _bottomSheet = inject(MatBottomSheet);
  private snackBar = inject(MatSnackBar);

  sermones = signal<IsermonResponse[]>([]);
  selectedDocument: any = null;
  documentModal: any;
  filtroSeleccionado: string | null = null;

  // Señales computadas para filtros y documentos filtrados
  filtrosDisponibles = computed(() => {
    const filtros = new Set<string>();
    this.sermones().forEach(sermon => {
      if (sermon.contrasena && sermon.contrasena.trim().length > 0) {
        filtros.add(sermon.contrasena);
      }
    });
    return Array.from(filtros);
  });

  sermonesFiltrados = computed(() => {
    if (!this.filtroSeleccionado) {
      return this.sermones();
    }
    return this.sermones().filter(sermon => 
      sermon.contrasena === this.filtroSeleccionado
    );
  });

  constructor(
    private serivcioCompartido: ComunicacionEntreComponentesService,
    private dialog: MatDialog,
    private servicio1db: ServicioApi1DbService,
    private router: Router,
    private comunicacionService: ComunicacionEntreComponentesService
  ) {}

  ngOnInit() {
    this.serivcioCompartido.barraInferior.set(false);
    this.getSermonesByStorage();
    this.sincronizarSermones();
    window.addEventListener('online', () => {
      this.sincronizarSermones();
      this.snackBar.open('Conexión recuperada. Sincronizando...', 'Cerrar', { duration: 3000 });
    });
    
    // Añadir listener para cuando se recupere la conexión
 
  }

  ngAfterViewInit() {
    // Inicializar el modal de Bootstrap
    this.documentModal = new bootstrap.Modal(document.getElementById('documentModal'), {
      keyboard: true,
      backdrop: true
    });
  }

  async getSermonesByStorage(){
    const { value } = await Storage.get({ key: 'sermones' });
    if (value) {
      this.sermones.set(JSON.parse(value));
      console.log("storage", JSON.parse(value))
    }
  }

  async getSermones() {
    if (navigator.onLine) {
      this.servicio1db.getSermones().subscribe(
        async (data) => {
          this.sermones.set(data);
          console.log(data);
          // Almacenar la data en el Storage
          await Storage.set({
            key: 'sermones',
            value: JSON.stringify(data)
          });
        },
        async (error) => {

        }
      );
    } else {
     
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(CrearWordComponent, {
      disableClose: false,
      data: {},
      width: '300px'
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('El diálogo se cerró');
      this.getSermones();
    });
  }

  openBottomSheet(sermon: any): void {
    this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: "word-sermones",
        objeto: sermon,
      },
    }).afterDismissed().subscribe(()=>{
      this.getSermones();
    });
  }

  vistaPrevia(documento: any) {
    // Establecer el documento seleccionado para el modal
    this.selectedDocument = documento;
    
    // Mostrar el modal de Bootstrap
    this.documentModal.show();
  }
  editarDocumento(documento: any) {
    if (!documento || !documento.id) {
      // Manejar el caso de un documento sin ID
      this.snackBar.open('Error: Documento sin identificador', 'Cerrar', { duration: 3000 });
      return;
    }
  
    if (!navigator.onLine) {
      // Si estamos offline, usar el servicio de comunicación para pasar el sermón
      this.comunicacionService.sermonActual.set(documento);
      console.log(documento);
      console.log(this.comunicacionService.sermonActual())
    }
    
    // Navegar solo si tenemos un ID válido
    this.router.navigate(['/editor', documento.id]);
  }

  // Métodos para el filtrado
  aplicarFiltro(filtro: string): void {
    if (this.filtroSeleccionado === filtro) {
      this.filtroSeleccionado = null; // Deseleccionar si ya está seleccionado
    } else {
      this.filtroSeleccionado = filtro;
    }
  }

  limpiarFiltro(): void {
    this.filtroSeleccionado = null;
  }

  async sincronizarSermones() {
   
    try {
      const { value } = await Storage.get({ key: 'sermones' });
      if (!value) return;

      const sermones = JSON.parse(value);
      const sermonesOffline = sermones.filter((sermon: any) => sermon.temporal === 1606);
      const sermonesEditados = sermones.filter((sermon: any) => sermon.temporal === 1677);

      console.log(sermonesOffline, sermonesEditados)
      if (sermonesOffline.length === 0 && sermonesEditados.length === 0) return;

      for (const sermon of sermonesEditados){
        try {
          const data = await this.servicio1db.putSermones(sermon).subscribe((data:any) => {
            console.log(data)
          });
        } catch (error) {
          console.error('Error al actualizar en la nube:', error);
          this.snackBar.open('Error al actualizar en la nube: ' + error, 'Cerrar', { duration: 3000 });
        }
      }

      // Procesar cada sermón offline
      for (const sermon of sermonesOffline) {
        try {
          const oldId = sermon.id;
          sermon.temporal = undefined;
          // Eliminar el ID temporal si existe
          sermon.id = undefined;
          // Subir el sermón
          let data: any = null;
          await this.servicio1db.postSermones(sermon).subscribe((Ddata) => {
            console.log(data)
            console.log('Sermón sincronizado:', Ddata);
            data = Ddata;
            this.snackBar.open('Actualizado correctamente', 'Cerrar', { duration: 3000 });
          });
        } catch (error) {
          console.error('Error al sincronizar sermón:', error);
        }
      }
    } catch (error) {
      console.error('Error en la sincronización:', error);
      this.snackBar.open('Error en la sincronización', 'Cerrar', { duration: 3000 });
    } finally {
      setTimeout(() => {
            this.getSermones();
            return;
      }, 2000);
    }
  }

  ngOnDestroy(){
    this.serivcioCompartido.barraInferior.set(true);
  }
}