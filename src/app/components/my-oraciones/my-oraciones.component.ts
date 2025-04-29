import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIcon } from '@angular/material/icon';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { CrearOracionComponent } from '../crear-oracion/crear-oracion.component';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AccionesComponent } from '../../shared/acciones/acciones.component';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { Storage } from '@capacitor/storage';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';

declare var bootstrap: any; // Para usar Bootstrap modal

@Component({
  selector: 'app-my-oraciones',
  standalone: true,
  imports: [
    MatCardModule,
    MatTableModule,
    MatGridListModule,
    MatAccordion,
    MatExpansionModule,
    MatIcon,
    MatButtonModule,
    HeaderCardComponent,
    CommonModule,
    MatSlideToggleModule
  ],
  templateUrl: './my-oraciones.component.html',
  styleUrls: ['./my-oraciones.component.css']
})
export class MyOracionesComponent {
  dataSource = signal<any[]>([]);
  private _bottomSheet = inject(MatBottomSheet);
  selectedOracion: any = null;
  private oracionModal: any;

  constructor(
    private servicioCompartido: ComunicacionEntreComponentesService,
    private serviceApiDb: ServicioApi1DbService, 
    private dialog: MatDialog,
    private snackbar: MatSnackBar
  ) {}

  ngOnInit() {
    this.servicioCompartido.barraInferior.set(false);
    this.recuperarDataDelStorage();
    this.getOraciones();
  }

  ngAfterViewInit() {
    // Inicializar el modal de Bootstrap
    this.oracionModal = new bootstrap.Modal(document.getElementById('oracionModal'));
  }

  openOracionModal(oracion: any) {
    this.selectedOracion = oracion;
    // Abrir el modal usando Bootstrap
    this.oracionModal.show();
  }

  onOracionStatusChange(respondida: boolean) {
    if (this.selectedOracion) {
      // Si no tenía fecha de respuesta y se marca como respondida, asignar la fecha actual
      if (respondida && !this.selectedOracion.fechaRespuesta) {
        this.selectedOracion.fechaRespuesta = new Date().toISOString().split('T')[0];
      } else if (!respondida) {
        // Si se marca como no respondida, eliminar la fecha de respuesta
        this.selectedOracion.fechaRespuesta = null;
      }

      this.selectedOracion.respondida = respondida;
      
      // Actualizar en la base de datos
    //   this.serviceApiDb.putOraciones(this.selectedOracion).subscribe(
    //     (response) => {
    //       console.log('Oración actualizada:', response);
    //       this.snackbar.open('Oración actualizada', 'Cerrar', {
    //         duration: 2000
    //       });
    //     },
    //     (error) => {
    //       console.error('Error al actualizar la oración:', error);
    //     }
    //   );
    }
  }

  async getOraciones() {
    if (navigator.onLine) {
      this.serviceApiDb.getOraciones().subscribe(
        async data => {
          this.dataSource.set(data);
          // Almacenamos la data en el Storage
          await Storage.set({
            key: 'oraciones',
            value: JSON.stringify(data)
          });
        },
        async error => {
          // Si hay error, se intenta recuperar la data del Storage
          const { value } = await Storage.get({ key: 'oraciones' });
          if (value) {
            this.dataSource.set(JSON.parse(value));
          }
        }
      );
    } else {
      // Sin conexión: se recupera la data del Storage
      const { value } = await Storage.get({ key: 'oraciones' });
      if (value) {
        this.dataSource.set(JSON.parse(value));
      }
    }
  }

  crearOraciones() {
    const dialogRef = this.dialog.open(CrearOracionComponent, {
      disableClose: false,
      width: '300px',
      height: '390px'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getOraciones();
    });
  }

  openBottomSheet(devocion: any): void {
    this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: 'oracion-filtros',
        objeto: devocion
      }
    }).afterDismissed().subscribe(()=>{
      this.getOraciones();
    });
  }

  async recuperarDataDelStorage(){
    const { value } = await Storage.get({ key: 'oraciones' });
    if (value) {
      this.dataSource.set(JSON.parse(value));
    }
  }

  ngOnDestroy(){
    this.servicioCompartido.barraInferior.set(true);
  }
}