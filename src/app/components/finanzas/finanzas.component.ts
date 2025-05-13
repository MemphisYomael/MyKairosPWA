import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { CrearIngresoEgresoComponent } from '../../shared/crear-ingreso-egreso/crear-ingreso-egreso.component';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { IFinanza } from '../../interfaces/ifinanza';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { HeaderCardComponent } from '../../shared/header-card/header-card.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { AccionesComponent } from '../../shared/acciones/acciones.component';
// Importamos Storage de Capacitor
import { Storage } from '@capacitor/storage';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';
import { HeaderCardYellowComponent } from "../../shared/header-card-yellow/header-card-yellow.component";

@Component({
  selector: 'app-finanzas',
  standalone: true,
  providers: [provideNativeDateAdapter()],
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatProgressBarModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    HeaderCardComponent,
    HeaderCardYellowComponent
],
  templateUrl: './finanzas.component.html',
  styleUrls: ['./finanzas.component.css']  // Corregido: styleUrls en lugar de styleUrl
})
export class FinanzasComponent {
  progressBar = signal<boolean>(false);
  private _snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['fecha', 'monto', 'acciones'];
  finanzas = signal<IFinanza[]>([]);

  ingreso = signal<number[]>([]);
  egreso = signal<number[]>([]);
  comprometido = signal<number>(0);
  TotalIngresos= signal<number>(0);
  TotalEgresos = signal<number>(0);
  private _bottomSheet = inject(MatBottomSheet);

  constructor(private serivcioCompartido: ComunicacionEntreComponentesService,private dialog: MatDialog, private servicioApi1Db: ServicioApi1DbService) {}

  ngOnInit() {
    this.serivcioCompartido.barraInferior.set(false);
     this.recuperarDataDelStorage();
    this.getFinanzas();
  }

  // Función para procesar la data y calcular ingresos, egresos y comprometido
  private processFinanzas(data: any[]) {
    // Reiniciamos contadores y arrays
    this.ingreso.set([]);
    this.egreso.set([]);
    this.comprometido.set(0);
    this.TotalIngresos.set(0);
    this.TotalEgresos.set(0);

    data.forEach(element => {
      if (element.nombre === 'Ingreso') {
        this.ingreso.update(arr => [...arr, element.precio]);
        this.TotalIngresos.update(total => total + element.precio);
      } else if (element.nombre === 'Egreso') {
        this.egreso.update(arr => [...arr, element.precio]);
        this.TotalEgresos.update(total => total + element.precio);
      } else if (element.nombre === 'Dinero Comprometido') {
        this.comprometido.update(total => total + element.precio);
      }
    });
  }

  async getFinanzas() {
    this.progressBar.set(true);
    if (navigator.onLine) {
     await this.servicioApi1Db.getFinanzas().subscribe(
        async (data: any[]) => {
          this.finanzas.set(data);
          this.progressBar.set(false);
          // Guardamos la data en el Storage
          await Storage.set({
            key: 'finanzas',
            value: JSON.stringify(data)
          });
         await this.processFinanzas(data);
        },
        async error => {
          // En caso de error, se intenta recuperar la data del Storage
          const { value } = await Storage.get({ key: 'finanzas' });
          if (value) {
            const storedData = JSON.parse(value);
            this.finanzas.set(storedData);
          await this.processFinanzas(storedData);
          }
          this.progressBar.set(false);
        }
      );
    } else {
      // Sin conexión a internet: se recupera la data del Storage
      const { value } = await Storage.get({ key: 'finanzas' });
      if (value) {
        const storedData = JSON.parse(value);
        this.finanzas.set(storedData);
        this.progressBar.set(false);
        console.log('Usuario offline: data recuperada del Storage.');
        this.processFinanzas(storedData);
      } else {
        console.log('Usuario offline y no hay data almacenada en Storage.');
        this.progressBar.set(false);
      }
    }
  }

  openBottomSheet(devocion: any): void {
    this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: 'finanzas-publicidades',
        objeto: devocion
      }
    }).afterDismissed().subscribe(()=>{
      this.getFinanzas();
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(CrearIngresoEgresoComponent, {
      disableClose: false,
      width: '300px'
    });

    dialogRef.afterClosed().subscribe(() => {
      // Puedes llamar a getFinanzas() si se necesita refrescar la data
      this.getFinanzas();
    });
  }

  openSnackBar(message: string) {
    this._snackBar.open(message, 'Ok');
  }


  async recuperarDataDelStorage(){
    const { value } = await Storage.get({ key: 'finanzas' });
    if(value){
    const storedData = JSON.parse(value);
    this.finanzas.set(storedData);
    this.progressBar.set(false);
    console.log('Usuario offline: data recuperada del Storage.');
    this.processFinanzas(storedData);
    }
  }

  ngOnDestroy(){
    this.serivcioCompartido.barraInferior.set(true);
  }
}
