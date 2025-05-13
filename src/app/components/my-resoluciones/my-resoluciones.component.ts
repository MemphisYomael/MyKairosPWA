import { Component, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { AccionesComponent } from '../../shared/acciones/acciones.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Storage } from '@capacitor/storage';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { CrearResolucionesComponent } from '../crear-resoluciones/crear-resoluciones.component';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { HeaderCardGreenComponent } from "../../shared/header-card-green/header-card-green.component";

@Component({
  selector: 'app-my-resoluciones',
  standalone: true,
  imports: [MatListModule, MatDividerModule, MatCardModule, MatIconModule, MatButtonModule, CommonModule, HeaderCardComponent, HeaderCardGreenComponent],
  templateUrl: './my-resoluciones.component.html',
  styleUrl: './my-resoluciones.component.css'
})
export class MyResolucionesComponent {

  resoluciones = signal<any[]>([]);
  private _bottomSheet = inject(MatBottomSheet);

  constructor(
    private servicioCompartido: ComunicacionEntreComponentesService,
    private api1db: ServicioApi1DbService, private dialog: MatDialog) {}

  ngOnInit() {
    this.servicioCompartido.barraInferior.set(false);
    this.recuperarDataDelStorage();
    this.getResoluciones();
  }

  async recuperarDataDelStorage(){
    const { value } = await Storage.get({ key: 'resoluciones' });
          if (value) {
            this.resoluciones.set(JSON.parse(value));
          }
  }

  async getResoluciones() {
    if (navigator.onLine) {
      this.api1db.getResoluciones().subscribe(
        async (data: any[]) => {
          this.resoluciones.set(data);
          await Storage.set({ key: 'resoluciones', value: JSON.stringify(data) });
        },
        async (error) => {
          const { value } = await Storage.get({ key: 'resoluciones' });
          if (value) {
            this.resoluciones.set(JSON.parse(value));
          }
        }
      );
    } else {
      const { value } = await Storage.get({ key: 'resoluciones' });
      if (value) {
        this.resoluciones.set(JSON.parse(value));
      }
    }
  }

  openBottomSheet(resolucion: any): void {
    this._bottomSheet.open(AccionesComponent, {
      data: { endpoint: 'resolucion-clasificaciones', objeto: resolucion }
    }).afterDismissed().subscribe(()=>{
      this.getResoluciones();
    });
  }

  crearResolucion() {
    const dialogRef = this.dialog.open(CrearResolucionesComponent, {
      disableClose: false,
      width: '300px'
    });

    dialogRef.afterClosed().subscribe(() => {
      console.log('Diálogo cerrado, recargando resoluciones.');
      this.getResoluciones();
    });
  }

  ngOnDestroy(){
    this.servicioCompartido.barraInferior.set(true);
  }
}
