import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { CrearDeevocionalComponent } from '../../shared/crear-deevocional/crear-deevocional.component';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ServicioApi1DbService } from '../../services/servicio-api1-db.service';
import { ImydevocionalesConsejerias } from '../../interfaces/imydevocionales-consejerias';
import { CommonModule } from '@angular/common';
import { MatAccordion, MatExpansionModule } from '@angular/material/expansion';
import { AccionesComponent } from '../../shared/acciones/acciones.component';
import {
  MatBottomSheet,
  MatBottomSheetModule,
} from '@angular/material/bottom-sheet';
import { HeaderCardComponent } from '../../shared/header-card/header-card.component';
// Importamos Storage de Capacitor de forma estática
import { Storage } from '@capacitor/storage';
import {
  MatSlideToggle,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { ComunicacionEntreComponentesService } from '../../services/comunicacion-entre-componentes.service';

declare var bootstrap: any; // Para usar Bootstrap modal

@Component({
  selector: 'app-my-devocionales',
  standalone: true,
  imports: [
    MatBottomSheetModule,
    MatExpansionModule,
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatProgressBarModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    HeaderCardComponent,
    MatSlideToggleModule,
    MatSlideToggle,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './my-devocionales.component.html',
  styleUrls: ['./my-devocionales.component.css'],
})
export class MyDevocionalesComponent {
  private _bottomSheet = inject(MatBottomSheet);
  displayedColumns: string[] = ['dia', 'pasaje', 'detalles', 'acciones'];
  dataSource: any = signal('');
  email: string | null = '';
  togleStatus = signal(false);
  selectedDevocional: any = null;
  private devocionalModal: any;

  constructor(
    private servicioCompartido: ComunicacionEntreComponentesService,
    private dialog: MatDialog,
    private serviceApi: ServicioApi1DbService
  ) {
    // Ya no es necesario inyectar Storage ni inicializarlo
  }

  ngOnInit() {
    this.servicioCompartido.barraInferior.set(false);
    this.recuperarDataDelStorage();
    this.getDevocionales();
    this.email = this.serviceApi.getEmail();
  }

  ngAfterViewInit() {
    // Inicializar el modal de Bootstrap
    this.devocionalModal = new bootstrap.Modal(document.getElementById('devocionalModal'));
  }

  openDevocionalModal(devocional: any) {
    this.selectedDevocional = devocional;
    // Abrir el modal usando Bootstrap
    this.devocionalModal.show();
  }

  async revisarLocal() {
    const { value } = await Storage.get({ key: 'devocionales' });
    if (value) {
      const devocionalesLocales = JSON.parse(value);
      devocionalesLocales.forEach((element: any) => {
        console.log(element)
        if(element.Contrasena === "160616"){
            this.serviceApi.postDevocionales(element).subscribe((data) => {
                console.log("enviado", data)
            })
        }
      });
    }
  }

  toggleStatusFunction(checked: boolean): void {
    this.togleStatus.set(checked); // Aquí puedes agregar la lógica para manejar el cambio de estado
  }

  async getDevocionales() {
    this.revisarLocal();
    if (navigator.onLine) {
      this.serviceApi.GetDevocionales().subscribe(
        async (data) => {
          // Asignamos la data a la variable local
          console.log(data);
          this.dataSource.set(data); // Guardamos la data en Storage usando la API actual
          await Storage.set({
            key: 'devocionales',
            value: JSON.stringify(data),
          });
        },
        async (error) => {
          // En caso de error, tratamos de recuperar la data del Storage
          const { value } = await Storage.get({ key: 'devocionales' });
          if (value) {
            this.dataSource.set(JSON.parse(value));
          }
        }
      );
    } else {
      // Sin conexión: recuperamos la data del Storage
      const { value } = await Storage.get({ key: 'devocionales' });
      if (value) {
        this.dataSource.set(JSON.parse(value));
      } else {
      }
    }
  }

  openBottomSheet(devocion: any): void {
    this._bottomSheet.open(AccionesComponent, {
      data: {
        endpoint: 'devocional-consejeria',
        objeto: devocion,
      },
    }).afterDismissed().subscribe(()=>{
      this.getDevocionales();
    });
  }

  openDialog(): void {
    const dialogRef = this.dialog.open(CrearDeevocionalComponent, {
      disableClose: false,
      width: '300px',
      height: '390px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('El diálogo se cerró');
      this.getDevocionales();
    });
  }

  async recuperarDataDelStorage() {
    const { value } = await Storage.get({ key: 'devocionales' });
    if (value) {
      this.dataSource.set(JSON.parse(value));
    }
  }

  ngOnDestroy(){
    this.servicioCompartido.barraInferior.set(true);
  }
}