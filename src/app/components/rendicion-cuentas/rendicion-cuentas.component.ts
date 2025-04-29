import { Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CrearRendicionCuentasComponent } from '../crear-rendicion-cuentas/crear-rendicion-cuentas.component';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { AccionesComponent } from '../../shared/acciones/acciones.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AppComponent } from '../../app.component';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HeaderCardComponent } from "../../shared/header-card/header-card.component";
import { Storage } from '@capacitor/storage';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';

@Component({
  selector: 'app-rendicion-cuentas',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatCardModule,
    MatInputModule,
    MatDatepickerModule,
    MatTableModule,
    MatIconModule,
    MatIcon,
    MatButtonModule,
    CommonModule,
    HeaderCardComponent
  ],
  templateUrl: './rendicion-cuentas.component.html',
  styleUrls: ['./rendicion-cuentas.component.css']
})
export class RendicionCuentasComponent {
  readonly panelOpenState = signal(false);

  displayedColumns: string[] = ['tentacion', 'fecha', 'acciones'];
  dataSource = signal<any[]>([]);
  public chart: any;
  private _bottomSheet = inject(MatBottomSheet);
  private _snackBar = inject(MatSnackBar);

  // Variables para trabajar con la data de tentaciones
  tentaciones: any[] = [];
  counts: { [key: string]: number } = {};
  maxCount: number = 0;

  constructor(
    private servicioCompartido: ComunicacionEntreComponentesService,
    private serviceApi: ServicioApi1DbService, private dialog: MatDialog) {}

  ngOnInit(): void {
    this.servicioCompartido.barraInferior.set(false);
    this.obtenerDataDelStorage();
    this.getTentaciones();
  }

  async obtenerDataDelStorage(){
    const { value } = await Storage.get({ key: 'tentaciones' });
          if (value) {
            const offlineData = JSON.parse(value);
            this.dataSource.set(offlineData);
            this.tentaciones = offlineData || [];
            console.log("Data recuperada del Storage debido a error en la API.");
            const detallesArray = this.tentaciones.map(item => item.detalles);
            this.counts = this.countOccurrences(detallesArray);
            this.maxCount = Math.max(...Object.values(this.counts));
          }
  }

  openSnackBar(message: string) {
    this._snackBar.open('', message + ' | ' + "ok");
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(CrearRendicionCuentasComponent, {
      disableClose: false,
      data: {},
      width: '300px',
      height: '360px'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getTentaciones();
    });
  }

  openBottomSheet(objeto: any): void {
    this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: 'rendicion-reuniones',
        objeto: objeto
      }
    }).afterDismissed().subscribe(()=>{
      this.getTentaciones();
    });
  }

  async getTentaciones(): Promise<void> {
    if (navigator.onLine) {
      this.serviceApi.getTentaciones().subscribe(
        async (data: any[]) => {
          console.log("Data from API:", data);
          this.dataSource.set(data);
          this.tentaciones = data || [];
          // Almacenar la data en Storage
          await Storage.set({
            key: 'tentaciones',
            value: JSON.stringify(data)
          });
          console.log("Data obtenida de la API y almacenada en Storage.");
          const detallesArray = this.tentaciones.map(item => item.detalles);
          this.counts = this.countOccurrences(detallesArray);
          this.maxCount = Math.max(...Object.values(this.counts));
        },
        async (error) => {
          console.error("Error al llamar a la API:", error);
          // Recuperar la data del Storage en caso de error
          const { value } = await Storage.get({ key: 'tentaciones' });
          if (value) {
            const offlineData = JSON.parse(value);
            this.dataSource = offlineData;
            this.tentaciones = offlineData || [];
            console.log("Data recuperada del Storage debido a error en la API.");
            const detallesArray = this.tentaciones.map(item => item.detalles);
            this.counts = this.countOccurrences(detallesArray);
            this.maxCount = Math.max(...Object.values(this.counts));
          }
        }
      );
    } else {
      // Sin conexión: recuperar la data del Storage
      const { value } = await Storage.get({ key: 'tentaciones' });
      if (value) {
        const offlineData = JSON.parse(value);
        this.dataSource = offlineData;
        this.tentaciones = offlineData || [];
        console.log("Usuario offline: data recuperada del Storage.");
        const detallesArray = this.tentaciones.map(item => item.detalles);
        this.counts = this.countOccurrences(detallesArray);
        this.maxCount = Math.max(...Object.values(this.counts));
      } else {
        console.log("Usuario offline y no hay data almacenada en Storage.");
      }
    }
  }

  countOccurrences(array: string[]): { [key: string]: number } {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  ngOnDestroy(){
    this.servicioCompartido.barraInferior.set(true);
  }
}
